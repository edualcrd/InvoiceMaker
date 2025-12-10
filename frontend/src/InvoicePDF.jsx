// frontend/src/InvoicePDF.jsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#09090B', lineHeight: 1.5 },

  // Encabezado (Logo y Título)
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, borderBottom: '2px solid #000', paddingBottom: 10 },
  brand: { fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase' },
  invoiceTitle: { fontSize: 16, color: '#71717A', alignSelf: 'flex-end' },

  // Bloque de direcciones (Grid de 2 columnas)
  addressesContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  addressBlock: { width: '45%' },
  label: { fontSize: 8, color: '#71717A', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  text: { fontSize: 10, marginBottom: 2 },
  bold: { fontWeight: 'bold', fontSize: 11 },

  // Detalles de factura (Fecha y número)
  metaContainer: { flexDirection: 'row', gap: 40, marginBottom: 30 },

  // Tabla
  tableHeader: { flexDirection: 'row', borderBottom: '1px solid #E4E4E7', paddingBottom: 5, marginBottom: 10 },
  tableRow: { flexDirection: 'row', paddingBottom: 8, paddingTop: 8, borderBottom: '1px solid #F4F4F5' },
  colDesc: { width: '50%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right', fontFamily: 'Courier' },

  // Totales
  totalsSection: { marginTop: 20, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', marginBottom: 5 },
  totalLabel: { width: 100, textAlign: 'right', marginRight: 10, color: '#71717A' },
  totalValue: { width: 80, textAlign: 'right', fontFamily: 'Courier' },
  grandTotal: { fontSize: 14, fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: 5, marginTop: 5 },

  // Footer (IBAN)
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, borderTop: '1px solid #E4E4E7', paddingTop: 10 },
  iban: { fontSize: 9, color: '#71717A', textAlign: 'center' }
});

const InvoicePDF = ({ factura, perfil }) => {
  // Cálculos
  const base = factura.items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0);
  const iva = base * 0.21;
  const irpf = base * 0.15;
  const total = base + iva - irpf;

  // Datos del emisor (Tu perfil o fallback si no hay datos)
  const emisor = perfil || {
    nombre: 'TU EMPRESA',
    nif: 'B-00000000',
    direccion: 'Configura tus datos en Ajustes',
    email: 'info@ejemplo.com',
    iban: ''
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.header}>

          {/* LÓGICA: ¿Hay logo? Pon imagen. ¿No? Pon texto. */}
          {emisor.logo ? (
            <Image
              src={emisor.logo}
              style={{ width: 60, height: 60, objectFit: 'contain' }} // Ajusta el tamaño aquí
            />
          ) : (
            <Text style={styles.brand}>{emisor.nombre || 'INVOICEMAKER'}</Text>
          )}

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.invoiceTitle}>FACTURA</Text>
            <Text style={{ fontFamily: 'Courier', fontSize: 12 }}>#{factura.numero}</Text>
          </View>
        </View>

        {/* DIRECCIONES */}
        <View style={styles.addressesContainer}>
          {/* COLUMNA IZQUIERDA: EMISOR (TÚ) */}
          <View style={styles.addressBlock}>
            <Text style={styles.label}>De (Emisor):</Text>
            <Text style={styles.bold}>{emisor.nombre}</Text>
            <Text style={styles.text}>{emisor.nif}</Text>
            <Text style={styles.text}>{emisor.direccion}</Text>
            <Text style={styles.text}>{emisor.email}</Text>
          </View>

          {/* COLUMNA DERECHA: CLIENTE */}
          <View style={styles.addressBlock}>
            <Text style={styles.label}>Para (Cliente):</Text>
            <Text style={styles.bold}>{factura.cliente.nombre}</Text>
            <Text style={styles.text}>{factura.cliente.nif}</Text>
            <Text style={styles.text}>{factura.cliente.direccion}</Text>
            <Text style={styles.text}>{factura.cliente.email}</Text>
          </View>
        </View>

        {/* TABLA */}
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>DESCRIPCIÓN</Text>
          <Text style={styles.colQty}>CANT</Text>
          <Text style={styles.colPrice}>PRECIO</Text>
          <Text style={styles.colTotal}>TOTAL</Text>
        </View>

        {factura.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.concepto}</Text>
            <Text style={styles.colQty}>{item.cantidad}</Text>
            <Text style={styles.colPrice}>{item.precio.toFixed(2)}€</Text>
            <Text style={styles.colTotal}>{(item.cantidad * item.precio).toFixed(2)}€</Text>
          </View>
        ))}

        {/* TOTALES */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Base Imponible:</Text>
            <Text style={styles.totalValue}>{base.toFixed(2)}€</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA (21%):</Text>
            <Text style={styles.totalValue}>{iva.toFixed(2)}€</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IRPF (-15%):</Text>
            <Text style={styles.totalValue}>-{irpf.toFixed(2)}€</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>TOTAL: {total.toFixed(2)}€</Text>
          </View>
        </View>

        {/* FOOTER CON IBAN */}
        {emisor.iban && (
          <View style={styles.footer}>
            <Text style={styles.iban}>Pago por transferencia bancaria al IBAN: {emisor.iban}</Text>
            <Text style={styles.iban}>Titular: {emisor.nombre}</Text>
          </View>
        )}

      </Page>
    </Document>
  );
};

export default InvoicePDF;