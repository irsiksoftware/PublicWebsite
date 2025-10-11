/**
 * Live Chat Integration
 * Supports Intercom, Drift, and Zendesk Chat platforms
 */

class LiveChatManager {
    constructor() {
        this.platform = null;
        this.initialized = false;
        this.config = {
            intercom: {
                appId: window.LIVE_CHAT_CONFIG?.intercom?.appId || '',
                enabled: window.LIVE_CHAT_CONFIG?.intercom?.enabled || false
            },
            drift: {
                appId: window.LIVE_CHAT_CONFIG?.drift?.appId || '',
                enabled: window.LIVE_CHAT_CONFIG?.drift?.enabled || false
            },
            zendeskChat: {
                key: window.LIVE_CHAT_CONFIG?.zendeskChat?.key || '',
                enabled: window.LIVE_CHAT_CONFIG?.zendeskChat?.enabled || false
            }
        };
    }

    /**
     * Initialize the appropriate chat platform
     */
    init() {
        if (this.initialized) {
            return;
        }

        // Priority order: Intercom > Drift > Zendesk Chat
        if (this.config.intercom.enabled && this.config.intercom.appId) {
            this.initIntercom();
        } else if (this.config.drift.enabled && this.config.drift.appId) {
            this.initDrift();
        } else if (this.config.zendeskChat.enabled && this.config.zendeskChat.key) {
            this.initZendeskChat();
        }
    }

    /**
     * Initialize Intercom
     */
    initIntercom() {
        if (this.initialized) return;

        const appId = this.config.intercom.appId;

        window.intercomSettings = {
            api_base: 'https://api-iam.intercom.io',
            app_id: appId
        };

        (function(){
            var w=window;
            var ic=w.Intercom;
            if(typeof ic==='function'){
                ic('reattach_activator');
                ic('update',w.intercomSettings);
            }else{
                var d=document;
                var i=function(){
                    i.c(arguments);
                };
                i.q=[];
                i.c=function(args){
                    i.q.push(args);
                };
                w.Intercom=i;
                var l=function(){
                    var s=d.createElement('script');
                    s.type='text/javascript';
                    s.async=true;
                    s.src='https://widget.intercom.io/widget/' + appId;
                    var x=d.getElementsByTagName('script')[0];
                    x.parentNode.insertBefore(s,x);
                };
                if(document.readyState==='complete'){
                    l();
                }else if(w.attachEvent){
                    w.attachEvent('onload',l);
                }else{
                    w.addEventListener('load',l,false);
                }
            }
        })();

        this.platform = 'intercom';
        this.initialized = true;
        console.log('Intercom chat initialized');
    }

    /**
     * Initialize Drift
     */
    initDrift() {
        if (this.initialized) return;

        const appId = this.config.drift.appId;

        !function() {
            var t = window.driftt = window.drift = window.driftt || [];
            if (!t.init) {
                if (t.invoked) return void (window.console && console.error && console.error('Drift snippet included twice.'));
                t.invoked = !0, t.methods = [ 'identify', 'config', 'track', 'reset', 'debug', 'show', 'ping', 'page', 'hide', 'off', 'on' ],
                t.factory = function(e) {
                    return function() {
                        var n = Array.prototype.slice.call(arguments);
                        return n.unshift(e), t.push(n), t;
                    };
                }, t.methods.forEach(function(e) {
                    t[e] = t.factory(e);
                }), t.load = function(t) {
                    var e = 3e5, n = Math.ceil(new Date() / e) * e, o = document.createElement('script');
                    o.type = 'text/javascript', o.async = !0, o.crossorigin = 'anonymous', o.src = 'https://js.driftt.com/include/' + n + '/' + t + '.js';
                    var i = document.getElementsByTagName('script')[0];
                    i.parentNode.insertBefore(o, i);
                };
            }
        }();
        window.drift.SNIPPET_VERSION = '0.3.1';
        window.drift.load(appId);

        this.platform = 'drift';
        this.initialized = true;
        console.log('Drift chat initialized');
    }

    /**
     * Initialize Zendesk Chat
     */
    initZendeskChat() {
        if (this.initialized) return;

        const key = this.config.zendeskChat.key;

        window.$zopim||(function(d,s){
            var z=window.$zopim=function(c){z._.push(c);},$=z.s=
            d.createElement(s),e=d.getElementsByTagName(s)[0];
            z.set=function(o){z.set._.push(o);};z._=[];z.set._=[];
            $.async=!0;$.setAttribute('charset','utf-8');
            $.src='https://v2.zopim.com/?'+key;z.t=+new Date;$.
                type='text/javascript';e.parentNode.insertBefore($,e);
        })(document,'script');

        this.platform = 'zendeskChat';
        this.initialized = true;
        console.log('Zendesk Chat initialized');
    }

    /**
     * Show the chat widget
     */
    show() {
        if (!this.initialized) {
            console.warn('Live chat not initialized');
            return;
        }

        switch(this.platform) {
        case 'intercom':
            if (window.Intercom) {
                window.Intercom('show');
            }
            break;
        case 'drift':
            if (window.drift) {
                window.drift.api.openChat();
            }
            break;
        case 'zendeskChat':
            if (window.$zopim) {
                window.$zopim.livechat.window.show();
            }
            break;
        }
    }

    /**
     * Hide the chat widget
     */
    hide() {
        if (!this.initialized) {
            return;
        }

        switch(this.platform) {
        case 'intercom':
            if (window.Intercom) {
                window.Intercom('hide');
            }
            break;
        case 'drift':
            if (window.drift) {
                window.drift.api.toggleChat();
            }
            break;
        case 'zendeskChat':
            if (window.$zopim) {
                window.$zopim.livechat.window.hide();
            }
            break;
        }
    }

    /**
     * Update user information
     * @param {Object} userData - User data object
     */
    updateUser(userData) {
        if (!this.initialized) {
            return;
        }

        switch(this.platform) {
        case 'intercom':
            if (window.Intercom) {
                window.Intercom('update', userData);
            }
            break;
        case 'drift':
            if (window.drift) {
                window.drift.identify(userData.userId, {
                    email: userData.email,
                    name: userData.name
                });
            }
            break;
        case 'zendeskChat':
            if (window.$zopim) {
                if (userData.name) {
                    window.$zopim.livechat.setName(userData.name);
                }
                if (userData.email) {
                    window.$zopim.livechat.setEmail(userData.email);
                }
            }
            break;
        }
    }

    /**
     * Track events
     * @param {string} eventName - Event name
     * @param {Object} metadata - Event metadata
     */
    trackEvent(eventName, metadata = {}) {
        if (!this.initialized) {
            return;
        }

        switch(this.platform) {
        case 'intercom':
            if (window.Intercom) {
                window.Intercom('trackEvent', eventName, metadata);
            }
            break;
        case 'drift':
            if (window.drift) {
                window.drift.track(eventName, metadata);
            }
            break;
        case 'zendeskChat':
            // Zendesk Chat doesn't have a native event tracking API
            console.log('Event tracked:', eventName, metadata);
            break;
        }
    }
}

// Initialize on page load
if (typeof window !== 'undefined') {
    window.liveChatManager = new LiveChatManager();

    // Auto-initialize if config is present
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.liveChatManager.init();
        });
    } else {
        window.liveChatManager.init();
    }
}

export default LiveChatManager;
