import { invariant } from 'outvariant'
import { Emitter } from 'strict-event-emitter'
import { HttpRequestEventMap, IS_PATCHED_MODULE } from '../../glossary'
import { Interceptor, InterceptorContext } from '../../Interceptor'
import { createXMLHttpRequestProxy } from './XMLHttpRequestProxy'

export type XMLHttpRequestEmitter = Emitter<HttpRequestEventMap>

export class XMLHttpRequestInterceptor extends Interceptor<HttpRequestEventMap> {
  static interceptorSymbol = Symbol('xhr')

  constructor(context: InterceptorContext = globalThis) {
    super(XMLHttpRequestInterceptor.interceptorSymbol, context)
  }

  protected checkEnvironment() {
    return typeof this.context.XMLHttpRequest !== 'undefined'
  }

  protected setup() {
    const logger = this.logger.extend('setup')

    logger.info('patching "XMLHttpRequest" module...')

    const PureXMLHttpRequest = this.context.XMLHttpRequest

    invariant(
      !(PureXMLHttpRequest as any)[IS_PATCHED_MODULE],
      'Failed to patch the "XMLHttpRequest" module: already patched.'
    )

    this.context.XMLHttpRequest = createXMLHttpRequestProxy({
      emitter: this.emitter,
      logger: this.logger,
      context: this.context
    })

    logger.info(
      'native "XMLHttpRequest" module patched!',
      this.context.XMLHttpRequest.name
    )

    Object.defineProperty(this.context.XMLHttpRequest, IS_PATCHED_MODULE, {
      enumerable: true,
      configurable: true,
      value: true,
    })

    this.subscriptions.push(() => {
      Object.defineProperty(this.context.XMLHttpRequest, IS_PATCHED_MODULE, {
        value: undefined,
      })

      this.context.XMLHttpRequest = PureXMLHttpRequest
      logger.info(
        'native "XMLHttpRequest" module restored!',
        this.context.XMLHttpRequest.name
      )
    })
  }
}
