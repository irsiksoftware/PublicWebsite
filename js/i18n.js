/**
 * Internationalization (i18n) module for multi-language support
 */

const translations = {
    en: {
        nav: {
            home: 'Home',
            services: 'Services',
            portfolio: 'Portfolio',
            team: 'Team',
            tetris: 'Tetris',
            contact: 'Contact Us'
        },
        hero: {
            title: 'Transform Your Business with Custom Software Solutions',
            subtitle: 'IrsikSoftware delivers innovative enterprise solutions combining cutting-edge technology with exceptional service to drive your success',
            cta: 'Request a Demo'
        },
        sections: {
            overview: 'Overview',
            services: 'Services',
            about: 'About Us',
            portfolio: 'Portfolio',
            caseStudies: 'Case Studies',
            team: 'Leadership Team',
            testimonials: 'What Our Clients Say',
            technologies: 'Technologies'
        },
        overview: {
            tagline: 'Enterprise Software Solutions & AI Innovation',
            description: 'IrsikSoftware delivers cutting-edge enterprise solutions that combine traditional software engineering excellence with innovative AI technologies. We partner with organizations to transform their digital infrastructure and unlock new capabilities through intelligent automation and advanced software development practices.'
        },
        services: {
            customSoftware: {
                title: 'Custom Software Development',
                description: 'We build tailored software solutions that address your unique business challenges. Our expert team delivers scalable, maintainable applications using modern technologies and industry best practices.'
            },
            ai: {
                title: 'AI/ML Solutions',
                description: 'Transform your business with intelligent automation and machine learning capabilities. We develop custom AI solutions that enhance decision-making, automate workflows, and unlock insights from your data.'
            },
            cloud: {
                title: 'Cloud Architecture',
                description: 'Design and implement robust cloud infrastructure that scales with your business. We architect secure, cost-effective cloud solutions across AWS, Azure, and Google Cloud platforms.'
            },
            devops: {
                title: 'DevOps Consulting',
                description: 'Accelerate your software delivery with modern DevOps practices and automation. We implement CI/CD pipelines, infrastructure as code, and monitoring solutions to streamline your development workflow.'
            }
        },
        about: {
            mission: 'Mission Statement:',
            missionText: 'At IrsikSoftware, we are committed to delivering innovative software solutions that empower businesses to achieve their goals through cutting-edge technology and exceptional service.'
        },
        footer: {
            copyright: '© 2025 IrsikSoftware. All rights reserved.',
            privacy: 'Privacy Policy',
            terms: 'Terms of Service'
        },
        cookieConsent: {
            message: 'We use cookies to enhance your browsing experience. By continuing to use this site, you consent to our use of cookies.',
            accept: 'Accept',
            decline: 'Decline',
            learnMore: 'Learn More'
        },
        contact: {
            title: 'Contact Us',
            name: 'Name',
            email: 'Email',
            subject: 'Subject',
            message: 'Message',
            send: 'Send Message',
            success: 'Message sent successfully!',
            error: 'Error sending message. Please try again.'
        },
        languageSelector: {
            label: 'Language',
            english: 'English',
            spanish: 'Español',
            french: 'Français',
            german: 'Deutsch',
            japanese: '日本語'
        }
    },
    es: {
        nav: {
            home: 'Inicio',
            services: 'Servicios',
            portfolio: 'Portafolio',
            team: 'Equipo',
            tetris: 'Tetris',
            contact: 'Contáctenos'
        },
        hero: {
            title: 'Transforme su Negocio con Soluciones de Software Personalizadas',
            subtitle: 'IrsikSoftware ofrece soluciones empresariales innovadoras que combinan tecnología de vanguardia con un servicio excepcional para impulsar su éxito',
            cta: 'Solicitar una Demo'
        },
        sections: {
            overview: 'Resumen',
            services: 'Servicios',
            about: 'Sobre Nosotros',
            portfolio: 'Portafolio',
            caseStudies: 'Casos de Estudio',
            team: 'Equipo de Liderazgo',
            testimonials: 'Lo que Dicen Nuestros Clientes',
            technologies: 'Tecnologías'
        },
        overview: {
            tagline: 'Soluciones de Software Empresarial e Innovación en IA',
            description: 'IrsikSoftware ofrece soluciones empresariales de vanguardia que combinan la excelencia tradicional en ingeniería de software con tecnologías innovadoras de IA. Nos asociamos con organizaciones para transformar su infraestructura digital y desbloquear nuevas capacidades a través de la automatización inteligente y prácticas avanzadas de desarrollo de software.'
        },
        services: {
            customSoftware: {
                title: 'Desarrollo de Software Personalizado',
                description: 'Construimos soluciones de software personalizadas que abordan sus desafíos comerciales únicos. Nuestro equipo experto entrega aplicaciones escalables y mantenibles utilizando tecnologías modernas y mejores prácticas de la industria.'
            },
            ai: {
                title: 'Soluciones de IA/ML',
                description: 'Transforme su negocio con capacidades de automatización inteligente y aprendizaje automático. Desarrollamos soluciones de IA personalizadas que mejoran la toma de decisiones, automatizan flujos de trabajo y desbloquean información de sus datos.'
            },
            cloud: {
                title: 'Arquitectura en la Nube',
                description: 'Diseñe e implemente una infraestructura de nube robusta que escale con su negocio. Arquitecturamos soluciones de nube seguras y rentables en plataformas AWS, Azure y Google Cloud.'
            },
            devops: {
                title: 'Consultoría DevOps',
                description: 'Acelere la entrega de su software con prácticas modernas de DevOps y automatización. Implementamos pipelines de CI/CD, infraestructura como código y soluciones de monitoreo para optimizar su flujo de trabajo de desarrollo.'
            }
        },
        about: {
            mission: 'Declaración de Misión:',
            missionText: 'En IrsikSoftware, estamos comprometidos a entregar soluciones de software innovadoras que empoderan a las empresas para alcanzar sus objetivos a través de tecnología de vanguardia y servicio excepcional.'
        },
        footer: {
            copyright: '© 2025 IrsikSoftware. Todos los derechos reservados.',
            privacy: 'Política de Privacidad',
            terms: 'Términos de Servicio'
        },
        cookieConsent: {
            message: 'Utilizamos cookies para mejorar su experiencia de navegación. Al continuar usando este sitio, usted consiente el uso de cookies.',
            accept: 'Aceptar',
            decline: 'Rechazar',
            learnMore: 'Más Información'
        },
        contact: {
            title: 'Contáctenos',
            name: 'Nombre',
            email: 'Correo Electrónico',
            subject: 'Asunto',
            message: 'Mensaje',
            send: 'Enviar Mensaje',
            success: '¡Mensaje enviado exitosamente!',
            error: 'Error al enviar el mensaje. Por favor, inténtelo de nuevo.'
        },
        languageSelector: {
            label: 'Idioma',
            english: 'English',
            spanish: 'Español',
            french: 'Français',
            german: 'Deutsch',
            japanese: '日本語'
        }
    },
    fr: {
        nav: {
            home: 'Accueil',
            services: 'Services',
            portfolio: 'Portfolio',
            team: 'Équipe',
            tetris: 'Tetris',
            contact: 'Contactez-nous'
        },
        hero: {
            title: 'Transformez Votre Entreprise avec des Solutions Logicielles Personnalisées',
            subtitle: 'IrsikSoftware propose des solutions d\'entreprise innovantes combinant une technologie de pointe avec un service exceptionnel pour stimuler votre succès',
            cta: 'Demander une Démo'
        },
        sections: {
            overview: 'Aperçu',
            services: 'Services',
            about: 'À Propos de Nous',
            portfolio: 'Portfolio',
            caseStudies: 'Études de Cas',
            team: 'Équipe de Direction',
            testimonials: 'Ce que Disent Nos Clients',
            technologies: 'Technologies'
        },
        overview: {
            tagline: 'Solutions Logicielles d\'Entreprise et Innovation en IA',
            description: 'IrsikSoftware propose des solutions d\'entreprise de pointe qui combinent l\'excellence traditionnelle de l\'ingénierie logicielle avec des technologies IA innovantes. Nous nous associons avec des organisations pour transformer leur infrastructure numérique et débloquer de nouvelles capacités grâce à l\'automatisation intelligente et aux pratiques avancées de développement logiciel.'
        },
        services: {
            customSoftware: {
                title: 'Développement de Logiciels Personnalisés',
                description: 'Nous créons des solutions logicielles sur mesure qui répondent à vos défis commerciaux uniques. Notre équipe d\'experts fournit des applications évolutives et maintenables en utilisant des technologies modernes et les meilleures pratiques de l\'industrie.'
            },
            ai: {
                title: 'Solutions IA/ML',
                description: 'Transformez votre entreprise avec des capacités d\'automatisation intelligente et d\'apprentissage automatique. Nous développons des solutions IA personnalisées qui améliorent la prise de décision, automatisent les flux de travail et débloquent des informations à partir de vos données.'
            },
            cloud: {
                title: 'Architecture Cloud',
                description: 'Concevez et mettez en œuvre une infrastructure cloud robuste qui évolue avec votre entreprise. Nous architecturons des solutions cloud sécurisées et rentables sur les plateformes AWS, Azure et Google Cloud.'
            },
            devops: {
                title: 'Conseil DevOps',
                description: 'Accélérez la livraison de vos logiciels avec des pratiques DevOps modernes et l\'automatisation. Nous mettons en œuvre des pipelines CI/CD, l\'infrastructure en tant que code et des solutions de surveillance pour rationaliser votre flux de travail de développement.'
            }
        },
        about: {
            mission: 'Énoncé de Mission:',
            missionText: 'Chez IrsikSoftware, nous nous engageons à fournir des solutions logicielles innovantes qui permettent aux entreprises d\'atteindre leurs objectifs grâce à une technologie de pointe et un service exceptionnel.'
        },
        footer: {
            copyright: '© 2025 IrsikSoftware. Tous droits réservés.',
            privacy: 'Politique de Confidentialité',
            terms: 'Conditions d\'Utilisation'
        },
        cookieConsent: {
            message: 'Nous utilisons des cookies pour améliorer votre expérience de navigation. En continuant à utiliser ce site, vous consentez à notre utilisation de cookies.',
            accept: 'Accepter',
            decline: 'Refuser',
            learnMore: 'En Savoir Plus'
        },
        contact: {
            title: 'Contactez-nous',
            name: 'Nom',
            email: 'E-mail',
            subject: 'Sujet',
            message: 'Message',
            send: 'Envoyer le Message',
            success: 'Message envoyé avec succès!',
            error: 'Erreur lors de l\'envoi du message. Veuillez réessayer.'
        },
        languageSelector: {
            label: 'Langue',
            english: 'English',
            spanish: 'Español',
            french: 'Français',
            german: 'Deutsch',
            japanese: '日本語'
        }
    },
    de: {
        nav: {
            home: 'Startseite',
            services: 'Dienstleistungen',
            portfolio: 'Portfolio',
            team: 'Team',
            tetris: 'Tetris',
            contact: 'Kontakt'
        },
        hero: {
            title: 'Transformieren Sie Ihr Unternehmen mit Individuellen Softwarelösungen',
            subtitle: 'IrsikSoftware liefert innovative Unternehmenslösungen, die modernste Technologie mit außergewöhnlichem Service kombinieren, um Ihren Erfolg voranzutreiben',
            cta: 'Demo Anfordern'
        },
        sections: {
            overview: 'Überblick',
            services: 'Dienstleistungen',
            about: 'Über Uns',
            portfolio: 'Portfolio',
            caseStudies: 'Fallstudien',
            team: 'Führungsteam',
            testimonials: 'Was Unsere Kunden Sagen',
            technologies: 'Technologien'
        },
        overview: {
            tagline: 'Unternehmenssoftware-Lösungen und KI-Innovation',
            description: 'IrsikSoftware liefert hochmoderne Unternehmenslösungen, die traditionelle Software-Engineering-Exzellenz mit innovativen KI-Technologien kombinieren. Wir arbeiten mit Organisationen zusammen, um ihre digitale Infrastruktur zu transformieren und neue Fähigkeiten durch intelligente Automatisierung und fortschrittliche Softwareentwicklungspraktiken freizusetzen.'
        },
        services: {
            customSoftware: {
                title: 'Individuelle Softwareentwicklung',
                description: 'Wir entwickeln maßgeschneiderte Softwarelösungen, die Ihre einzigartigen geschäftlichen Herausforderungen bewältigen. Unser Expertenteam liefert skalierbare, wartbare Anwendungen unter Verwendung moderner Technologien und bewährter Industriepraktiken.'
            },
            ai: {
                title: 'KI/ML-Lösungen',
                description: 'Transformieren Sie Ihr Unternehmen mit intelligenten Automatisierungs- und Machine-Learning-Fähigkeiten. Wir entwickeln maßgeschneiderte KI-Lösungen, die die Entscheidungsfindung verbessern, Arbeitsabläufe automatisieren und Erkenntnisse aus Ihren Daten gewinnen.'
            },
            cloud: {
                title: 'Cloud-Architektur',
                description: 'Entwerfen und implementieren Sie robuste Cloud-Infrastruktur, die mit Ihrem Unternehmen skaliert. Wir entwickeln sichere, kosteneffektive Cloud-Lösungen auf AWS-, Azure- und Google Cloud-Plattformen.'
            },
            devops: {
                title: 'DevOps-Beratung',
                description: 'Beschleunigen Sie Ihre Softwarebereitstellung mit modernen DevOps-Praktiken und Automatisierung. Wir implementieren CI/CD-Pipelines, Infrastructure as Code und Überwachungslösungen, um Ihren Entwicklungsworkflow zu optimieren.'
            }
        },
        about: {
            mission: 'Leitbild:',
            missionText: 'Bei IrsikSoftware sind wir bestrebt, innovative Softwarelösungen zu liefern, die Unternehmen befähigen, ihre Ziele durch modernste Technologie und außergewöhnlichen Service zu erreichen.'
        },
        footer: {
            copyright: '© 2025 IrsikSoftware. Alle Rechte vorbehalten.',
            privacy: 'Datenschutzrichtlinie',
            terms: 'Nutzungsbedingungen'
        },
        cookieConsent: {
            message: 'Wir verwenden Cookies, um Ihr Surferlebnis zu verbessern. Durch die fortgesetzte Nutzung dieser Website stimmen Sie unserer Verwendung von Cookies zu.',
            accept: 'Akzeptieren',
            decline: 'Ablehnen',
            learnMore: 'Mehr Erfahren'
        },
        contact: {
            title: 'Kontakt',
            name: 'Name',
            email: 'E-Mail',
            subject: 'Betreff',
            message: 'Nachricht',
            send: 'Nachricht Senden',
            success: 'Nachricht erfolgreich gesendet!',
            error: 'Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.'
        },
        languageSelector: {
            label: 'Sprache',
            english: 'English',
            spanish: 'Español',
            french: 'Français',
            german: 'Deutsch',
            japanese: '日本語'
        }
    },
    ja: {
        nav: {
            home: 'ホーム',
            services: 'サービス',
            portfolio: 'ポートフォリオ',
            team: 'チーム',
            tetris: 'テトリス',
            contact: 'お問い合わせ'
        },
        hero: {
            title: 'カスタムソフトウェアソリューションでビジネスを変革',
            subtitle: 'IrsikSoftwareは、最先端の技術と卓越したサービスを組み合わせた革新的なエンタープライズソリューションを提供し、お客様の成功を推進します',
            cta: 'デモをリクエスト'
        },
        sections: {
            overview: '概要',
            services: 'サービス',
            about: '会社概要',
            portfolio: 'ポートフォリオ',
            caseStudies: 'ケーススタディ',
            team: 'リーダーシップチーム',
            testimonials: 'お客様の声',
            technologies: '技術'
        },
        overview: {
            tagline: 'エンタープライズソフトウェアソリューションとAIイノベーション',
            description: 'IrsikSoftwareは、従来のソフトウェアエンジニアリングの卓越性と革新的なAI技術を組み合わせた最先端のエンタープライズソリューションを提供します。私たちは組織と提携して、デジタルインフラストラクチャを変革し、インテリジェントな自動化と高度なソフトウェア開発プラクティスを通じて新しい機能を解放します。'
        },
        services: {
            customSoftware: {
                title: 'カスタムソフトウェア開発',
                description: '独自のビジネス課題に対応するカスタマイズされたソフトウェアソリューションを構築します。当社の専門チームは、最新の技術と業界のベストプラクティスを使用して、スケーラブルで保守可能なアプリケーションを提供します。'
            },
            ai: {
                title: 'AI/MLソリューション',
                description: 'インテリジェントな自動化と機械学習機能でビジネスを変革します。意思決定を強化し、ワークフローを自動化し、データから洞察を引き出すカスタムAIソリューションを開発します。'
            },
            cloud: {
                title: 'クラウドアーキテクチャ',
                description: 'ビジネスとともにスケールする堅牢なクラウドインフラストラクチャを設計および実装します。AWS、Azure、Google Cloudプラットフォーム全体で安全でコスト効率の高いクラウドソリューションを設計します。'
            },
            devops: {
                title: 'DevOpsコンサルティング',
                description: '最新のDevOpsプラクティスと自動化により、ソフトウェアデリバリーを加速します。CI/CDパイプライン、Infrastructure as Code、監視ソリューションを実装して、開発ワークフローを効率化します。'
            }
        },
        about: {
            mission: 'ミッションステートメント:',
            missionText: 'IrsikSoftwareでは、最先端の技術と卓越したサービスを通じて、企業が目標を達成できるよう支援する革新的なソフトウェアソリューションを提供することに取り組んでいます。'
        },
        footer: {
            copyright: '© 2025 IrsikSoftware. 無断転載を禁じます。',
            privacy: 'プライバシーポリシー',
            terms: '利用規約'
        },
        cookieConsent: {
            message: 'ブラウジング体験を向上させるためにCookieを使用しています。このサイトを引き続き使用することにより、Cookieの使用に同意したものとみなされます。',
            accept: '同意する',
            decline: '拒否する',
            learnMore: '詳細を見る'
        },
        contact: {
            title: 'お問い合わせ',
            name: '名前',
            email: 'メールアドレス',
            subject: '件名',
            message: 'メッセージ',
            send: 'メッセージを送信',
            success: 'メッセージが正常に送信されました！',
            error: 'メッセージの送信中にエラーが発生しました。もう一度お試しください。'
        },
        languageSelector: {
            label: '言語',
            english: 'English',
            spanish: 'Español',
            french: 'Français',
            german: 'Deutsch',
            japanese: '日本語'
        }
    }
};

class I18n {
    constructor() {
        this.currentLanguage = this.getStoredLanguage() || this.detectBrowserLanguage();
        this.translations = translations;
    }

    getStoredLanguage() {
        try {
            return localStorage.getItem('preferredLanguage');
        } catch (e) {
            return null;
        }
    }

    detectBrowserLanguage() {
        try {
            const browserLang = navigator.language || navigator.userLanguage;
            if (!browserLang) {
                return 'en';
            }
            const langCode = browserLang.split('-')[0];
            return this.translations[langCode] ? langCode : 'en';
        } catch (e) {
            console.warn('Could not detect browser language, defaulting to English');
            return 'en';
        }
    }

    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            try {
                localStorage.setItem('preferredLanguage', lang);
            } catch (e) {
                console.warn('Could not save language preference to localStorage');
            }
            this.updatePageContent();
            document.documentElement.lang = lang;

            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
        }
    }

    t(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLanguage];

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return key;
            }
        }

        return value || key;
    }

    updatePageContent() {
    // Update navigation
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        // Update aria-labels
        document.querySelectorAll('[data-i18n-aria]').forEach(element => {
            const key = element.getAttribute('data-i18n-aria');
            element.setAttribute('aria-label', this.t(key));
        });

        // Update title attributes
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getAvailableLanguages() {
        return Object.keys(this.translations);
    }
}

// Initialize i18n
const i18n = new I18n();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = i18n;
}

// Make available globally
window.i18n = i18n;
