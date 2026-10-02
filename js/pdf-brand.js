/* Samaksh Travels — branded PDF builder (trip summary for visitors, quotation for the owner's private quote maker).
   Uses jsPDF, loaded on demand with an integrity hash. Standard PDF fonts only, so amounts are written as "Rs." */
(function (root) {
  'use strict';
  var JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  var JSPDF_SRI = 'sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk';
  var LOGO = 'data:image/png;base64,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';
  var BRAND = {
    name: 'Samaksh Travels', tagline: 'Flights · Trains · Cabs · Hotels · Holidays',
    phone: '+91 94199 61983', phone2: '+91 94191 61983', email: 'inquiry@samakshtravels.com', web: 'samakshtravels.com',
    address: 'Opp. 35 BRTF GREF Gate, Dhar Road, Udhampur – 182101, Jammu & Kashmir, India'
  };
  var C = { ink: [6, 8, 11], amber: [242, 169, 80], text: [32, 36, 44], mute: [110, 118, 130], line: [221, 225, 231], soft: [246, 247, 249] };
  var M = 16, PW = 210, PH = 297, CW = PW - 2 * M;

  function loadLib() {
    if (root.jspdf && root.jspdf.jsPDF) return Promise.resolve(root.jspdf.jsPDF);
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = JSPDF_URL; s.integrity = JSPDF_SRI; s.crossOrigin = 'anonymous';
      s.onload = function () { root.jspdf && root.jspdf.jsPDF ? res(root.jspdf.jsPDF) : rej(new Error('pdf library missing')); };
      s.onerror = function () { rej(new Error('pdf library failed to load')); };
      document.head.appendChild(s);
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today(d) { d = d || new Date(); return pad(d.getDate()) + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()] + ' ' + d.getFullYear(); }
  function refNo(prefix) { var d = new Date(); return prefix + '-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()); }
  function money(n) { return 'Rs. ' + (Math.round(n * 100) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: n % 1 ? 2 : 0 }); }
  function fix(t) { return String(t == null ? '' : t).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/₹/g, 'Rs. ').replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ–—•]/g, ''); }

  function Builder(JsPDF, title, ref, dateText) {
    var doc = new JsPDF({ unit: 'mm', format: 'a4', compress: true });
    var st = { doc: doc, y: 0, page: 1, title: title, ref: ref, date: dateText };
    function header(first) {
      var h = first ? 38 : 20;
      doc.setFillColor.apply(doc, C.ink); doc.rect(0, 0, PW, h, 'F');
      doc.setFillColor.apply(doc, C.amber); doc.rect(0, h, PW, 1.2, 'F');
      var ls = first ? 20 : 12;
      doc.addImage(LOGO, 'PNG', M, (h - ls) / 2, ls, ls);
      var tx = M + ls + 4;
      doc.setFont('times', 'bold'); doc.setFontSize(first ? 20 : 14); doc.setTextColor(238, 241, 245);
      doc.text('Samaksh', tx, first ? 18 : 12.4);
      var w = doc.getTextWidth('Samaksh ');
      doc.setFont('times', 'bolditalic'); doc.setTextColor.apply(doc, C.amber); doc.text('Travels', tx + w, first ? 18 : 12.4);
      if (first) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(170, 178, 190); doc.text(fix(BRAND.tagline), tx, 24.5); }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(first ? 11 : 9); doc.setTextColor.apply(doc, C.amber);
      doc.text(title.toUpperCase(), PW - M, first ? 15 : 9, { align: 'right', charSpace: 0.6 });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(first ? 8.5 : 8); doc.setTextColor(210, 215, 224);
      doc.text(fix(ref), PW - M, first ? 21.5 : 13.5, { align: 'right' });
      doc.text(fix(dateText), PW - M, first ? 26.5 : 17.5, { align: 'right' });
      st.y = h + 10;
    }
    st.start = function () { header(true); };
    st.ensure = function (h) { if (st.y + h > PH - 30) { footer(); doc.addPage(); st.page++; header(false); } };
    function footer() {
      doc.setDrawColor.apply(doc, C.line); doc.setLineWidth(0.3); doc.line(M, PH - 24, PW - M, PH - 24);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor.apply(doc, C.text);
      doc.text(BRAND.name, M, PH - 19);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor.apply(doc, C.mute);
      doc.text(fix(BRAND.address), M, PH - 15);
      doc.text(fix(BRAND.phone + '  |  ' + BRAND.phone2 + '  |  ' + BRAND.email + '  |  ' + BRAND.web), M, PH - 11);
    }
    st.finish = function () {
      footer(); var n = doc.getNumberOfPages();
      for (var i = 1; i <= n; i++) { doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor.apply(doc, C.mute); doc.text('Page ' + i + ' of ' + n, PW - M, PH - 11, { align: 'right' }); }
      return doc;
    };
    st.h2 = function (t) {
      st.ensure(14); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor.apply(doc, C.amber.map(function (v) { return Math.round(v * 0.82); }));
      doc.text(t.toUpperCase(), M, st.y, { charSpace: 0.8 }); doc.setDrawColor.apply(doc, C.line); doc.setLineWidth(0.3); doc.line(M, st.y + 2, PW - M, st.y + 2); st.y += 8;
    };
    st.kv = function (rows, colW) {
      colW = colW || 42; doc.setFontSize(9.5);
      rows.forEach(function (r) {
        if (!r[1] && r[1] !== 0) return;
        var lines = doc.splitTextToSize(fix(r[1]), CW - colW); st.ensure(lines.length * 5 + 2);
        doc.setFont('helvetica', 'normal'); doc.setTextColor.apply(doc, C.mute); doc.text(fix(r[0]), M, st.y);
        doc.setFont('helvetica', 'bold'); doc.setTextColor.apply(doc, C.text); doc.text(lines, M + colW, st.y); st.y += lines.length * 5 + 1.5;
      }); st.y += 3;
    };
    st.para = function (t, o) {
      o = o || {}; doc.setFont('helvetica', o.bold ? 'bold' : 'normal'); doc.setFontSize(o.size || 9.5); doc.setTextColor.apply(doc, o.color || C.text);
      var lines = doc.splitTextToSize(fix(t), o.width || CW); st.ensure(lines.length * 4.8 + 2); doc.text(lines, o.x || M, st.y); st.y += lines.length * 4.8 + (o.gap == null ? 3 : o.gap);
    };
    st.list = function (items, numbered) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor.apply(doc, C.text);
      items.forEach(function (t, i) {
        var lines = doc.splitTextToSize(fix(t), CW - 8); st.ensure(lines.length * 4.8 + 2);
        doc.setFont('helvetica', 'bold'); doc.setTextColor.apply(doc, C.amber.map(function (v) { return Math.round(v * 0.82); }));
        doc.text(numbered ? (i + 1) + '.' : '•', M + 1, st.y);
        doc.setFont('helvetica', 'normal'); doc.setTextColor.apply(doc, C.text); doc.text(lines, M + 8, st.y); st.y += lines.length * 4.8 + 1.4;
      }); st.y += 2;
    };
    st.box = function (t, label) {
      var lines = doc.splitTextToSize(fix(t), CW - 10), h = lines.length * 4.8 + 10; st.ensure(h);
      doc.setFillColor.apply(doc, C.soft); doc.setDrawColor.apply(doc, C.line); doc.roundedRect(M, st.y - 3, CW, h, 2, 2, 'FD');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor.apply(doc, C.text); doc.text(lines, M + 5, st.y + 3); st.y += h + 2;
    };
    return st;
  }

  /* ---------- Level 1: trip request summary for visitors (no prices) ---------- */
  function summary(d) {
    return loadLib().then(function (JsPDF) {
      var b = Builder(JsPDF, 'Trip request summary', refNo('SUM'), today()), doc = b.doc; b.start();
      b.h2('Prepared for');
      b.kv([['Name', d.name], ['Phone / WhatsApp', d.phone], ['Email', d.email]]);
      b.h2('Your trip');
      b.kv([['Service', d.service], ['Preference', d.tier], ['Travelling from', d.from], ['Going to', d.to], ['Travel date', d.date], ['Travellers', d.pax]]);
      if (d.note) { b.h2('Your notes'); b.box(d.note); }
      b.h2('What happens next');
      b.list([d.sent ? 'We have received your enquiry and will reply shortly on the phone number or email you gave us.' : 'Send this summary to us on WhatsApp ' + BRAND.phone + ', or press Send enquiry on ' + BRAND.web + '. Your request reaches us only when you send it.',
        'We reply with a clear written quote that lists exactly what is included and what is not.',
        'Once you confirm and pay, we book every ticket, stay and vehicle and send your full itinerary.'], true);
      b.para('This document records the details you entered. It is not a booking confirmation or a price quotation. Prices, availability and terms are confirmed by Samaksh Travels in writing.', { size: 8.5, color: C.mute });
      return b.finish();
    });
  }

  /* ---------- Level 3: quotation (owner's private quote maker) ---------- */
  function quotation(q) {
    return loadLib().then(function (JsPDF) {
      var b = Builder(JsPDF, 'Quotation', q.ref || refNo('Q'), today()), doc = b.doc; b.start();
      b.h2('Prepared for');
      b.kv([['Name', q.name], ['Phone / WhatsApp', q.phone], ['Email', q.email]]);
      b.h2('Trip details');
      b.kv([['Route / destination', q.route], ['Travel dates', q.dates], ['Travellers', q.pax], ['Quote valid until', q.valid]]);
      b.h2('Services and charges');
      var cx = { n: M + 2, d: M + 10, q: M + 122, r: M + 138, a: PW - M - 2 };
      function head() {
        b.ensure(12); doc.setFillColor.apply(doc, C.ink); doc.rect(M, b.y - 5, CW, 8, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(238, 241, 245);
        doc.text('#', cx.n, b.y); doc.text('DESCRIPTION', cx.d, b.y); doc.text('QTY', cx.q, b.y, { align: 'right' }); doc.text('RATE (Rs.)', cx.r + 12, b.y, { align: 'right' }); doc.text('AMOUNT (Rs.)', cx.a, b.y, { align: 'right' }); b.y += 7;
      }
      head();
      var sub = 0;
      q.items.forEach(function (it, i) {
        var amt = (it.qty || 0) * (it.rate || 0); sub += amt;
        var lines = doc.splitTextToSize(fix(it.desc), 90), h = Math.max(lines.length * 4.6, 5) + 3;
        if (b.y + h > PH - 30) { b.ensure(h + 14); head(); }
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor.apply(doc, C.text);
        doc.text(String(i + 1), cx.n, b.y); doc.text(lines, cx.d, b.y);
        doc.text(String(it.qty), cx.q, b.y, { align: 'right' }); doc.text((it.rate || 0).toLocaleString('en-IN'), cx.r + 12, b.y, { align: 'right' });
        doc.setFont('helvetica', 'bold'); doc.text(amt.toLocaleString('en-IN'), cx.a, b.y, { align: 'right' });
        doc.setDrawColor.apply(doc, C.line); doc.setLineWidth(0.2); doc.line(M, b.y + h - 3.6, PW - M, b.y + h - 3.6); b.y += h;
      });
      var disc = q.discount || 0, total = sub - disc;
      function tot(label, val, strong) {
        b.ensure(10); doc.setFont('helvetica', strong ? 'bold' : 'normal'); doc.setFontSize(strong ? 11.5 : 9.5); doc.setTextColor.apply(doc, C.text);
        if (strong) { doc.setFillColor.apply(doc, C.soft); doc.rect(M + 80, b.y - 5.5, CW - 80, 9, 'F'); }
        doc.text(label, cx.r - 20, b.y); doc.text(val, cx.a, b.y, { align: 'right' }); b.y += strong ? 9 : 6;
      }
      b.y += 2; tot('Subtotal', money(sub)); if (disc) tot('Discount', '- ' + money(disc)); tot('TOTAL', money(total), true); b.y += 4;
      if (q.inc) { b.h2('Included'); b.list(q.inc.split(/\n+/).filter(Boolean)); }
      if (q.exc) { b.h2('Not included'); b.list(q.exc.split(/\n+/).filter(Boolean)); }
      if (q.terms) { b.h2('Payment and cancellation'); b.para(q.terms); }
      if (q.note) { b.h2('Note'); b.para(q.note); }
      b.ensure(26); b.y += 4;
      b.para('Thank you for choosing ' + BRAND.name + '. To confirm this quotation, reply on WhatsApp ' + BRAND.phone + '.', { bold: true, size: 10 });
      b.para('Prepared by ' + (q.by || BRAND.name) + (q.gstin ? '  |  GSTIN: ' + q.gstin : ''), { size: 8.5, color: C.mute });
      return b.finish();
    });
  }

  root.SamakshPDF = { today: today, summary: summary, quotation: quotation, loadLib: loadLib, refNo: refNo, money: money, BRAND: BRAND };
})(typeof window !== 'undefined' ? window : globalThis);
