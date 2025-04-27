import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import './SubscribeButton.css';

export default function SubscribeButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubscribe = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 🔐 Obține token JWT
            const session = await supabase.auth.getSession();
            const jwt = session?.data?.session?.access_token;
            if (!jwt) throw new Error("Nu ești autentificat");

            // 🌐 Construiește URL-ul funcției
            const functionPath = import.meta.env.DEV
                ? 'http://localhost:54321/functions/v1/create-checkout-session' // local
                : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`; // cloud

            // 🔁 Trimite cererea POST către edge function
            const response = await fetch(functionPath, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                    priceId: 'price_1REvVJLAjQv1iDu3YwvZZktw',
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                console.error("❌ Răspuns invalid de la funcție:", err);
                throw new Error(err.error || "Eroare de la funcție");
            }

            const { url } = await response.json();
            if (url) {
                window.location.href = url;
            } else {
                throw new Error("URL-ul de checkout nu a fost returnat");
            }
        } catch (err) {
            console.error("❌ Eroare:", err);
            setError(err.message || "A apărut o eroare");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <button
                className="subscribe-button"
                onClick={handleSubscribe}
                disabled={isLoading}
            >
                {isLoading ? "Se încarcă..." : "Abonează-te"}
            </button>
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>
    );
}
