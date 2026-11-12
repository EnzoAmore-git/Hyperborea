import { Component } from 'react';

/**
 * Граница ошибок региона (Этап 6.4): падение секции не роняет всю страницу.
 * Показывает fallback с перезагрузкой региона и страницы.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  resetRegion = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { label = 'Раздел не загрузился', children } = this.props;
    if (error) {
      return (
        <div className="error-boundary" role="alert">
          <p className="meta">Сигнал потерян</p>
          <h2 className="error-boundary__title">{label}</h2>
          <p className="error-boundary__text">
            Похоже, тьма на мгновение поглотила этот участок. Попробуйте
            перезагрузить раздел или вернуться на страницу целиком.
          </p>
          <div className="error-boundary__actions">
            <button type="button" className="btn btn--ghost" onClick={this.resetRegion}>
              Перезагрузить раздел
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => window.location.reload()}
            >
              Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }
    return children;
  }
}