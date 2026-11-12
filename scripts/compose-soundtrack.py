"""Hyperborea revision 2: sparse, differentiated instrumental loops without drones.
Original additive synthesis, no neural model and no third-party recordings.
Requires numpy + ffmpeg. Output: seven MP3s, 21 gapless Opus stems,
phase-compatible transition demo, contrast sampler, manifest and measurements.
"""
import argparse, json, pathlib, re, shutil, subprocess, sys, wave
import numpy as np

sys.stdout.reconfigure(encoding='utf8')
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output',type=pathlib.Path,default=pathlib.Path('outputs/hyperborea'))
parser.add_argument('--render-dir',type=pathlib.Path,default=pathlib.Path('work/audio-render-v2'))
parser.add_argument('--map',type=pathlib.Path,default=pathlib.Path(__file__).resolve().parent.parent/'docs/soundtrack-map.json')
args=parser.parse_args()
OUT=args.output;TMP=args.render_dir
OUT.mkdir(parents=True,exist_ok=True);(OUT/'audio').mkdir(exist_ok=True);TMP.mkdir(parents=True,exist_ok=True)
SR=32000;BPM=80;BEAT=.75;BAR=3.;DUR=96;N=SR*DUR;REV='r2';TARGET=-23
FF=shutil.which('ffmpeg')
if not FF:FF=str(next(pathlib.Path(r'C:\Users\Fabol\AppData\Local\Microsoft\WinGet\Packages').glob('Gyan.FFmpeg*/ffmpeg*/bin/ffmpeg.exe')))
LABELS=json.loads(args.map.read_text(encoding='utf8'))['labels']

def hz(n):return 440*2**((n-69)/12)
def pan(x,p=0):
 return np.column_stack((x*np.cos((p+1)*np.pi/4),x*np.sin((p+1)*np.pi/4))).astype(np.float32)
def add(bus,x,start):
 i=round(start*SR)%N
 while len(x):
  k=min(N-i,len(x));bus[i:i+k]+=x[:k];x=x[k:];i=0
def env(t,d,a,r):
 return np.sin(np.minimum(t/a,1)*np.pi/2)**2*np.sin(np.clip((d-t)/r,0,1)*np.pi/2)**2
def note(n,d,kind,amp=.1,p=0):
 # Float64 phase avoids roughness in high partials. All events end smoothly.
 t=np.arange(round(d*SR))/SR;f=hz(n);x=np.zeros(len(t))
 if kind in ('nylon','felt','marimba','celesta'):
  recipes={
   'nylon':([1,2,3,4,5],[1,.25,.11,.05,.02],1.35),
   'felt':([1,2,3,4,5,6],[1,.24,.15,.065,.025,.012],.87),
   'marimba':([1,4,10],[1,.16,.025],2.15),
   'celesta':([1,2.003,3.997,5.995],[1,.1,.055,.015],1.3)}
  ratios,gains,decay=recipes[kind]
  for i,(ratio,g)in enumerate(zip(ratios,gains)):
   x+=g*np.sin(2*np.pi*f*ratio*t)*np.exp(-t*decay*(1+.42*i))
  x*=env(t,d,.012,.22)
 elif kind=='cello':
  vibrato=.012*np.sin(2*np.pi*4.5*t)*np.minimum(t/1.5,1)
  for h,g in [(1,.68),(2,.25),(3,.13),(4,.075),(5,.035),(6,.012)]:
   x+=g*np.sin(2*np.pi*f*h*t+vibrato*h)
  # Gentle bow articulation, deliberately no detuned swarm or long bass pedal.
  x*=env(t,d,.65,.95)*(.94+.06*np.cos(2*np.pi*.45*t))
 elif kind=='flute':
  for h,g in [(1,.9),(2,.13),(3,.025)]:
   x+=g*np.sin(2*np.pi*f*h*t+.015*np.sin(2*np.pi*4.7*t))
  x*=env(t,d,.13,.5)
 elif kind=='staccato':
  for h,g in [(1,.6),(2,.24),(3,.13),(4,.07),(5,.025)]:x+=g*np.sin(2*np.pi*f*h*t)
  x*=env(t,d,.022,.09)*np.exp(-t*3.2)
 elif kind=='organ':
  for h,g in [(1,.6),(2,.22),(3,.06)]:x+=g*np.sin(2*np.pi*f*h*t)
  x*=env(t,d,.24,.8)
 else:raise ValueError(kind)
 return pan(x*amp,p)

def hit(kind,amp,rng,p=0):
 d={'frame':.44,'tom':.27,'wood':.095,'brush':.18,'scrape':.85}[kind]
 t=np.arange(round(d*SR))/SR;x=np.zeros(len(t))
 if kind in ('frame','tom'):
  f=170 if kind=='frame' else 245
  phase=2*np.pi*(f*t+f*.13*.025*(1-np.exp(-t/.025)))
  x=(np.sin(phase)+.32*np.sin(phase*1.59)+.12*np.sin(phase*2.14))*np.exp(-t*(12 if kind=='frame' else 18))
  x*=env(t,d,.005,.05)
 else:
  noise=rng.normal(0,1,len(t));sp=np.fft.rfft(noise);fr=np.fft.rfftfreq(len(t),1/SR)
  center,width={'wood':(1500,600),'brush':(2200,1200),'scrape':(1100,600)}[kind]
  sp*=np.exp(-((fr-center)/width)**2)
  x=np.fft.irfft(sp,n=len(t))
  if kind=='scrape':x*=env(t,d,.23,.35)*(1+.4*np.sin(2*np.pi*17*t))
  else:x*=env(t,d,.004,.035)*np.exp(-t*(50 if kind=='wood' else 23))
 return pan(x*amp,p)

def room(x,amount=.12):
 # Short early reflections only, with circular tails to retain the loop.
 result=x.copy()
 for delay,gain in [(.083,.23),(.149,.16),(.241,.10),(.383,.05)]:
  result+=np.roll(x[:,::-1],round(delay*SR),axis=0)*amount*gain
 return result
def tidy(x):
 # Circular, zero-phase EQ preserves the 96s period. No sub-bass and no bright hiss.
 f=np.fft.rfftfreq(N,1/SR)
 highpass=(f/150)**6/(1+(f/150)**6)
 lowpass=1/np.sqrt(1+(f/5200)**8)
 lowmid=1-.36*np.exp(-.5*(np.log2(np.maximum(f,1)/245)/.42)**2)
 presence=1-.20*np.exp(-.5*(np.log2(np.maximum(f,1)/3000)/.48)**2)
 sp=np.fft.rfft(x,axis=0);sp*=(highpass*lowpass*lowmid*presence)[:,None]
 return np.fft.irfft(sp,n=N,axis=0).astype(np.float32)
def wav(p,x):
 with wave.open(str(p),'wb')as w:
  w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR)
  w.writeframes(np.round(np.clip(x,-.999,.999)*32767).astype('<i2').tobytes())
def encode(inp,out,mp3=False):
 codec=['-c:a','libmp3lame','-b:a','160k']if mp3 else ['-c:a','libopus','-b:a','80k']
 subprocess.run([FF,'-hide_banner','-loglevel','error','-y','-i',str(inp),*codec,str(out)],check=True)
def loudness(p):
 r=subprocess.run([FF,'-hide_banner','-i',str(p),'-af',f'loudnorm=I={TARGET}:TP=-3:LRA=10:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
 return json.loads(re.findall(r'\{\s*"input_i".*?\}',r.stderr,re.S)[-1])
def spectrum(x):
 # Channel energy, not a mono downmix that could hide panned low frequencies.
 sp=np.fft.rfft(x.astype(np.float64),axis=0);power=np.sum(np.abs(sp)**2,axis=1)*2/(len(x)**2*2)
 f=np.fft.rfftfreq(len(x),1/SR);total=power.sum()
 def energy(a,b):return float(power[(f>=a)&(f<b)].sum())
 return {'energyBelow120HzPercent':100*energy(20,120)/total,
  'lowBand40_180DbFS':float(10*np.log10(max(energy(40,180),1e-18))),
  'lowMid180_350DbFS':float(10*np.log10(max(energy(180,350),1e-18)))}

# State identity is always audible in the bed. The detail layer adds harmony;
# motion adds rhythm or a secondary gesture. No shared always-on drone.
report=[];mixes={}
manifest={'version':2,'revision':'r2','provenance':'Original sparse additive synthesis; no neural model or third-party samples. No continuous bass drone.','bpm':BPM,'loopSeconds':DUR,'sampleRate':SR,'tonalFamily':'A natural minor / C major, common 80 BPM grid','states':{}}
for mi,m in enumerate(LABELS):
 print('COMPOSE R2',m,flush=True);rng=np.random.default_rng(20261022+mi)
 bed,detail,motion=[np.zeros((N,2),np.float32)for _ in range(3)]
 def put(bus,n,start,kind,d=.9,amp=.1,p=0):add(bus,note(n,d,kind,amp,p),start)
 for phrase in range(8):
  start=phrase*12;v=phrase%4
  if m=='calm':
   # Conversational 3+3+2 phrasing, nylon warmth and real breathing spaces.
   melody=[(0,64),(1.5,67),(2.25,69),(4.5,72),(6,71),(7.5,67),(9,64)]
   if v==3:melody=[(0,64),(1.5,67),(3,69),(6,67),(8.25,64),(9.75,60)]
   for k,(t,n)in enumerate(melody):put(bed,n,start+t,'nylon',2.1,.16 if k%3==0 else .12,(-.16 if k%2 else .16))
   for t,notes in [(0,[60,64]),(6,[59,62])]:
    for j,n in enumerate(notes):put(detail,n,start+t+.1*j,'felt',2.7,.037,-.3+j*.6)
   put(motion,76,start+10.5,'marimba',1.15,.035,.25)
  elif m=='mystery':
   # Unequal question/answer intervals. No beat, no comfortable resolution.
   for t,n in [(0,76),(1.125,77),(4.125,71),(7.5,74),(10.125,76 if v%2 else 72)]:
    put(bed,n,start+t,'marimba',1.5,.16 if t==0 else .12,.23*np.sin(t))
   for t,n in [(2.25,64),(8.25,65)]:put(detail,n,start+t,'celesta',1.8,.062,-.25)
   put(motion,83,start+5.6,'celesta',1.4,.033,.4)
  elif m=='tension':
   # Dry clocklike insistence; restricted two-note figure with an unresolved end.
   for k in range(24):
    if k in (10,11,22):continue
    put(bed,[64,64,65,64][k%4],start+k*.375,'nylon',.42,.10 if k%4==0 else .063,.1)
   for t,n in [(0,57),(3,59),(6,60),(9,59)]:put(detail,n,start+t,'staccato',.48,.067,-.15)
   for k in range(16):
    if k%4!=3:add(motion,hit('wood',.15 if k%4==0 else .08,rng,(-.2 if k%2 else .2)),start+k*.75)
   put(motion,65,start+10.5,'flute',.62,.036,.25)
  elif m=='battle':
   # A four-note charging motif + distinct syncopated frame drums; no sub kick.
   shift=[0,-4,-2,0][v]
   notes=[57,60,64,67,64,60,62,59]
   for bar in range(4):
    for k,off in enumerate([0,.375,.75,1.5,1.875,2.25]):
     put(bed,notes[(k+bar)%8]+shift,start+bar*3+off,'staccato',.32,.145 if k in (0,3)else .095,(-.16 if k%2 else .16))
    for off,kind,amp in [(0,'frame',.27),(.75,'tom',.19),(1.125,'brush',.23),(1.5,'frame',.21),(2.25,'tom',.21),(2.625,'wood',.13)]:
     add(motion,hit(kind,amp,rng,(-.15 if off<1.5 else .15)),start+bar*3+off)
   for t,n in [(0,69+shift),(3,72+shift),(6,76+shift),(9,74+shift)]:put(detail,n,start+t,'flute',1.05,.07,.2)
  elif m=='sorrow':
   # A single descending lament. The long rests are part of the composition.
   melody=[(0,72,2.5),(3,71,2.1),(5.25,69,2.25),(8.25,64 if v%2==0 else 67,2.6)]
   for t,n,d in melody:put(bed,n,start+t,'cello',d,.12,-.08)
   for t,notes in [(0,[60,64]),(6,[59,62])]:
    for j,n in enumerate(notes):put(detail,n,start+t+.12*j,'felt',2.4,.032,.2)
   if v%2==0:put(motion,76,start+11,'felt',1.6,.025,-.3)
   else:put(motion,72,start+11,'felt',1.6,.025,.3)
  elif m=='horror':
   # Short, separated friction gestures. Fear without a permanent rumbling floor.
   for t,n in [(0,76),(2.125,77),(6.375,70),(9.125,76)]:
    put(bed,n,start+t,'cello',1.1,.092,-.2)
    put(bed,n+1,start+t+.11,'cello',.92,.047,.2)
   for t,n in [(3.75,65),(10.5,66)]:put(detail,n,start+t,'celesta',1.7,.07,.3)
   for t in [1.55,7.9]:add(motion,hit('scrape',.14,rng,(-.25 if t<5 else .25)),start+t)
  elif m=='sacred':
   # An unambiguously rising C-major theme, wide register, no sustained organ wall.
   melody=[(0,64),(1.5,67),(3,72),(4.5,76),(7.5,74),(9,72)]
   for k,(t,n)in enumerate(melody):put(bed,n,start+t,'flute',1.35 if k<4 else 1.8,.14 if k<4 else .1,(-.1 if k%2 else .1))
   for t,notes in [(0,[60,67]),(6,[62,69])]:
    for j,n in enumerate(notes):put(detail,n,start+t,'organ',2.1,.033,-.3+j*.6)
   for t,n in [(4.5,84),(10.5,79)]:put(motion,n,start+t,'celesta',1.7,.05,.3)
 stems=[tidy(room(x,.12 if m in ('mystery','sacred')else .055))for x in (bed,detail,motion)]
 mix=sum(stems);raw=TMP/(m+'-raw.wav');wav(raw,mix)
 levels=loudness(raw);gain=min(10**((TARGET-float(levels['input_i']))/20),10**((-3-float(levels['input_tp']))/20))
 stems=[x*gain for x in stems];mix=sum(stems);mixes[m]=mix
 mixed=TMP/(m+'.wav');wav(mixed,mix);encode(mixed,OUT/'audio'/f'{m}-{REV}.mp3',True)
 layers=[]
 for name,x in zip(('bed','detail','motion'),stems):
  p=TMP/f'{m}-{name}.wav';wav(p,x);encode(p,OUT/'audio'/f'{m}-{name}-{REV}.ogg')
  layer={'src':f'audio/soundtrack/{m}-{name}-{REV}.ogg','gain':1}
  if name=='detail':layer.update({'from':0,'to':.85,'floor':.4})
  if name=='motion':layer.update({'from':.15,'to':.85,'floor':.12 if m=='battle'else 0})
  layers.append(layer)
 manifest['states'][m]={'label':LABELS[m],'loopSeconds':DUR,'layers':layers}
 measured=loudness(mixed);diff=np.abs(np.diff(mix,axis=0));stats=spectrum(mix)
 qa={'mood':m,'label':LABELS[m],'seconds':DUR,'integratedLUFS':float(measured['input_i']),'truePeakDbTP':float(measured['input_tp']),
  'boundaryJump':float(np.max(np.abs(mix[0]-mix[-1]))),'internalDiff99_9':float(np.quantile(diff,.999)),**stats}
 baseline=pathlib.Path('work/audio-render')/(m+'.wav')
 if baseline.exists():
  with wave.open(str(baseline),'rb')as w:old=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2)/32768
  old_stats=spectrum(old);qa['previous']=old_stats
  qa['lowBand40_180ChangeDb']=stats['lowBand40_180DbFS']-old_stats['lowBand40_180DbFS']
 report.append(qa);print('RENDERED R2',json.dumps(qa,ensure_ascii=False),flush=True)

order=list(LABELS);segment=20;fade=6;step=segment-fade;length=step*(len(order)-1)+segment
demo=np.zeros((length*SR,2),np.float32)
for i,m in enumerate(order):
 start=i*step;indices=(np.arange(segment*SR)+start*SR)%N;x=mixes[m][indices].copy()
 if i:x[:fade*SR]*=np.sin(np.linspace(0,np.pi/2,fade*SR))[:,None]
 if i<len(order)-1:x[-fade*SR:]*=np.cos(np.linspace(0,np.pi/2,fade*SR))[:,None]
 demo[start*SR:(start+segment)*SR]+=x
demo[:SR]*=np.linspace(0,1,SR)[:,None];demo[-SR:]*=np.linspace(1,0,SR)[:,None]
if np.max(np.abs(demo))>.7:demo*=.7/np.max(np.abs(demo))
wav(TMP/'transitions.wav',demo);encode(TMP/'transitions.wav',OUT/'transitions-r2.mp3',True)
# A/B mood identification is easier without overlap: 12 seconds + 1 second silence.
contrast=np.zeros((90*SR,2),np.float32)
for i,m in enumerate(order):
 x=mixes[m][:12*SR].copy();x[:SR//4]*=np.linspace(0,1,SR//4)[:,None];x[-SR//2:]*=np.linspace(1,0,SR//2)[:,None]
 contrast[i*13*SR:(i*13+12)*SR]=x
wav(TMP/'contrast.wav',contrast);encode(TMP/'contrast.wav',OUT/'mood-contrast-r2.mp3',True)
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
(OUT/'audio-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print('COMPLETE R2: seven distinct arrangements, 21 stems, no continuous drone',flush=True)
