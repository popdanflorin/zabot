import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SubscriptionsPage.css";
import { supabase } from "../lib/supabaseClient";

const startCheckout = async (plan) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("Trebuie să fii autentificat pentru a cumpăra un abonament.");
        return;
    }

    const res = await fetch("https://yaltlxdrppiqlardcxwz.supabase.co/functions/v1/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: user.id,
            plan, // 'pro' sau 'team'
        }),
    });

    const data = await res.json();
    if (data?.url) {
        window.location.href = data.url; // redirecționează către Stripe
    } else {
        alert("Eroare la inițierea plății.");
        console.error(data);
    }
};

const featuresList = [
    { name: "2 boti easy (de încercare)", free: true, pro: true, team: true },
    { name: "Acces la toți botii", free: false, pro: true, team: true },
    { name: "Raport de performanță", free: false, pro: true, team: true },
    { name: "Descarcare raport PDF", free: false, pro: true, team: true },
    { name: "Până la 10 utilizatori", free: false, pro: false, team: true },
];

const SubscriptionsPage = () => {
    const navigate = useNavigate();
    const [fadeIn, setFadeIn] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFadeIn(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const goToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div className={`subscriptions-page ${fadeIn ? "fade-in" : ""}`}>
            <div className="top-bar">
                <button onClick={goToDashboard} className="back-button">
                    Înapoi la Dashboard
                </button>
            </div>

            <h1 className="page-title">Alege planul perfect pentru tine</h1>

            {/* Secțiunea cu abonamente */}
            <div className="pricing-buttons">
                <div className="plan-option">
                    <h2>Free</h2>
                    <p className="price">0$</p>
                    <button className="subscribe-plan-button free" disabled>Activ Automat</button>
                </div>

                <div className="plan-option popular">
                    <div className="badge badge-popular">Popular</div>
                    <h2>Pro</h2>
                    <p className="price">20$/lună</p>
                    <button className="subscribe-plan-button" onClick={() => startCheckout('pro')}>
                        Abonează-te
                    </button>
                </div>

                <div className="plan-option best-deal">
                    <div className="badge badge-bestdeal">Best Deal</div>
                    <h2>Team</h2>
                    <p className="price">100$/lună</p>
                    <button className="subscribe-plan-button" onClick={() => startCheckout('team')}>
                        Abonează-te
                    </button>
                </div>
            </div>

            {/* Secțiunea cu tabel de comparație */}
            <h2 className="comparison-title">Ce oferă fiecare plan</h2>

            <div className="comparison-table">
                <div className="table-header">
                    <div className="feature-title"></div>
                    <div className="plan-title">Free</div>
                    <div className="plan-title">Pro</div>
                    <div className="plan-title">Team</div>
                </div>

                {featuresList.map((feature, idx) => (
                    <div key={idx} className="table-row">
                        <div className="feature-title">{feature.name}</div>
                        <div className="plan-cell">{feature.free ? "✔️" : "❌"}</div>
                        <div className="plan-cell">{feature.pro ? "✔️" : "❌"}</div>
                        <div className="plan-cell">{feature.team ? "✔️" : "❌"}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SubscriptionsPage;
