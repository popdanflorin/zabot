import React from 'react';
import {Page, Text, View, Document, StyleSheet, Font} from '@react-pdf/renderer';
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



const ReportToPdf = ({ data }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.title}>Raport de Conversație</Text>

            <View style={styles.section}>
                <Text style={styles.heading}>Metrici de Comunicare</Text>
                <Text>Progres General: {data.overall_success}%</Text>
                <Text>Stil Asertiv: {data.assertive_percent}%</Text>
                <Text>Stil Agresiv: {data.aggressive_percent}%</Text>
                <Text>Stil Pasiv: {data.passive_percent}%</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.heading}>Puncte Forte în Dialog</Text>
                <Text>{data.dialogue_good_points}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.heading}>Recomandări</Text>
                <Text style={styles.bullet}>• {data.recommendation1}</Text>
                <Text style={styles.bullet}>• {data.recommendation2}</Text>
            </View>
        </Page>
    </Document>
);

export default ReportToPdf;
