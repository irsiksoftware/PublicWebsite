// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered successfully:', registration.scope);

                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60000); // Check every minute
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });

        // Listen for updates
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker updated, reloading page...');
            window.location.reload();
        });
    });
}
