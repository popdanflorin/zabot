import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { useTranslation } from 'react-i18next';
import robotoBase64 from "../../public/fonts/RobotoRegularBase64.js";

Font.register({
  family: 'Roboto',
  src: `data:font/truetype;charset=utf-8;base64,${robotoBase64}`,
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Roboto',
    lineHeight: 1.6
  },
  section: {
    marginBottom: 20
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    color: '#4CAF50',
    marginBottom: 20
  },
  heading: {
    fontSize: 14,
    marginBottom: 6,
    color: '#333',
    fontWeight: 'bold'
  },
  bullet: {
    marginLeft: 10,
    textIndent: -10
  }
});

const ReportToPdf = ({ data, userName, situationName, dataGenerarii }) => {
  const { t, i18n } = useTranslation();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{t('pdf.title')}</Text>

        <View style={styles.section}>
          <Text>
            {t('pdf.situation')}: {situationName || t('pdf.unknown_situation')}{"\n"}
            {t('pdf.date')}: {dataGenerarii?.toLocaleDateString(i18n.language)}{"\n"}
            {t('pdf.time')}: {dataGenerarii?.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}{"\n"}
            {t('pdf.user')}: {userName || t('pdf.anonymous')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>{t('pdf.communication_metrics')}</Text>
          <Text>{t('pdf.overall_success')}: {data.overall_success}%</Text>
          <Text>{t('pdf.assertive')}: {data.assertive_percent}%</Text>
          <Text>{t('pdf.aggressive')}: {data.aggressive_percent}%</Text>
          <Text>{t('pdf.passive')}: {data.passive_percent}%</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>{t('pdf.dialogue_strengths')}</Text>
          <Text>{data.dialogue_good_points}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>{t('pdf.recommendations')}</Text>
          <Text style={styles.bullet}>• {data.recommendation1}</Text>
          <Text style={styles.bullet}>• {data.recommendation2}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ReportToPdf;