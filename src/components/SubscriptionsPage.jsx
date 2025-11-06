import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import "./SubscriptionsPage.css";

const startCheckout = async (plan, t) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    alert(t("subscriptions.alerts.loginRequired"));
    return;
  }

  const res = await fetch("https://yaltlxdrppiqlardcxwz.supabase.co/functions/v1/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      user_id: session.user.id,
      plan
    })
  });

  const data = await res.json();

  if (data?.url) {
    window.location.href = data.url;
  } else {
    alert(t("subscriptions.alerts.paymentError"));
    console.error(data);
  }
};

const featuresList = [
  { key: "easySituations", free: true, pro: true, team: true },
  { key: "allSituations", free: false, pro: true, team: true },
  { key: "monthlySituations", free: false, pro: true, team: true },
  { key: "performanceReport", free: false, pro: true, team: true },
  { key: "downloadPdf", free: false, pro: true, team: true },
  { key: "teamUsers", free: false, pro: false, team: true }
];

const SubscriptionsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
          {t("subscriptions.backToDashboard")}
        </button>
      </div>

      <h1 className="page-title">{t("subscriptions.pageTitle")}</h1>

      <div className="pricing-buttons">
        <div className="plan-option">
          <h2>{t("subscriptions.freePlan")}</h2>
          <p className="price">0 RON</p>
          <button className="subscribe-plan-button free" disabled>
            {t("subscriptions.activateAutomatically")}
          </button>
        </div>

        <div className="plan-option popular">
          <div className="badge badge-popular">{t("subscriptions.popular")}</div>
          <h2>{t("subscriptions.proPlan")}</h2>
          <div className="price">
            <div className="old-price">{t("subscriptions.oldPrice", { price: 149 })}</div>
            <div className="new-price">{t("subscriptions.newPrice", { price: 99 })}</div>
            <div>{t("subscriptions.tva-text")}</div>
          </div>
          <button className="subscribe-plan-button" onClick={() => startCheckout('pro', t)}>
            {t("subscriptions.subscribe")}
          </button>
        </div>

        <div className="plan-option best-deal">
          <div className="badge badge-bestdeal">{t("subscriptions.bestDeal")}</div>
          <h2>{t("subscriptions.teamPlan")}</h2>
          <div className="price">
            <div className="old-price">{t("subscriptions.oldPrice", { price: 1399 })}</div>
            <div className="new-price">{t("subscriptions.newPrice", { price: 899 })}</div>
            <div>{t("subscriptions.tva-text")}</div>
          </div>
          <button className="subscribe-plan-button" onClick={() => startCheckout('team', t)}>
            {t("subscriptions.subscribe")}
          </button>
        </div>
      </div>

      <h2 className="comparison-title">{t("subscriptions.comparisonTitle")}</h2>

      <div className="comparison-table">
        <div className="table-header">
          <div className="feature-title"></div>
          <div className="plan-title">{t("subscriptions.freePlan")}</div>
          <div className="plan-title">{t("subscriptions.proPlan")}</div>
          <div className="plan-title">{t("subscriptions.teamPlan")}</div>
        </div>

        {featuresList.map((feature, idx) => (
          <div key={idx} className="table-row">
            <div className="feature-title">{t(`subscriptions.features.${feature.key}`)}</div>
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