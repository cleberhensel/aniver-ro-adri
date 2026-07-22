/* O Que Será — dados melódicos + MIDI + render (tom Dm, ~120 BPM) */
(function (global) {
  'use strict';

  const NOTE_MIDI = {
    'dó': 60, 'dó#': 61, 'ré': 62, 'ré#': 63, 'fá': 65, 'fá#': 66,
    'mi': 64, 'sol': 67, 'lá': 69, 'sib': 70, 'si': 71
  };

  const NOTE_CLASS = {
    'dó': 'n-c', 'dó#': 'n-cs', 'ré': 'n-d', 'fá': 'n-f', 'fá#': 'n-fs',
    'mi': 'n-e', 'sol': 'n-g', 'lá': 'n-a', 'sib': 'n-bb', 'si': 'n-b'
  };

  const MOTIF_LABELS = {
    hook: 'Gancho',
    A: 'Motivo A — cliché descendente',
    B: 'Motivo B — fecha em lá (5ª)',
    C: 'Motivo C — arco dó#–ré–mi',
    D: 'Motivo D — tensão em LÁ',
    E: 'Motivo E — grupeto fá#–dó–ré',
    F: 'Motivo F — refrão filosófico',
    G: 'Motivo G — tríade negativa',
    H: 'Motivo H — cadência final'
  };

  function zip(lyricParts, notes, dur) {
    return lyricParts.map((text, i) => ({
      text,
      note: notes[i],
      dur: dur || (text === text.toUpperCase() && text.length <= 3 ? 0.75 : 0.5)
    }));
  }

  function L(chords, motif, parts, notes, dur) {
    return { chords, motif, syllables: zip(parts, notes, dur) };
  }

  const STANZAS = [
    {
      id: 'e1', title: 'Estrofe 1 — centro em Dm', center: 'Dm',
      lines: [
        L('Dm  Dm7M  Dm7', 'hook',
          ['O', 'que', 'se', 'rá,', 'que', 'se', 'rá'],
          ['lá', 'lá', 'dó', 'ré', 'fá', 'ré', 'fá']),
        L('Dm6  Am  Am7M  Am7', 'A',
          ['Que', 'an', 'dam', 'sus', 'pi', 'ran', 'do', 'pe', 'las', 'al', 'co', 'vas'],
          ['ré', 'mi', 'fá#', 'mi', 'ré', 'fá#', 'mi', 'ré', 'fá#', 'mi', 'ré', 'lá']),
        L('Am6  Gm  Gm7M  Gm7', 'B',
          ['Que', 'an', 'dam', 'sus', 'sur', 'ran', 'do', 'em', 'ver', 'sos', 'e', 'tro', 'vas'],
          ['ré', 'mi', 'fá#', 'mi', 'ré', 'lá', 'lá', 'lá', 'lá', 'lá', 'lá', 'lá', 'lá']),
        L('Gm6  Bbm  Bbm7M  Em7(5-)', 'C',
          ['Que', 'an', 'dam', 'com', 'bi', 'nan', 'do', 'no', 'breu', 'das', 'to', 'cas'],
          ['dó#', 'ré', 'mi', 'ré', 'dó#', 'mi', 'mi', 'mi', 'mi', 'mi', 'mi', 'mi']),
        L('A7(13-)  Dm  Dm7M  Dm7', 'D',
          ['Que', 'an', 'da', 'nas', 'ca', 'be', 'ças,', 'an', 'da', 'nas', 'bo', 'cas'],
          ['ré', 'mi', 'fá#', 'mi', 'ré', 'LÁ', 'LÁ', 'LÁ', 'LÁ', 'LÁ', 'LÁ', 'LÁ']),
        L('Dm6  Am  Am7M  Am7', 'A',
          ['Que', 'an', 'dam', 'a', 'cen', 'den', 'do', 've', 'las', 'nos', 'be', 'cos'],
          ['ré', 'mi', 'fá#', 'mi', 'ré', 'fá#', 'mi', 'ré', 'fá#', 'mi', 'ré', 'lá']),
        L('Am6  Gm  Gm7M  Gm7', 'B',
          ['Que', 'es', 'tão', 'fa', 'lan', 'do', 'al', 'to', 'pe', 'los', 'bo', 'te', 'cos'],
          ['ré', 'mi', 'fá#', 'mi', 'ré', 'lá', 'lá', 'lá', 'lá', 'lá', 'lá', 'lá', 'lá']),
        L('Gm6  Bbm  Bbm7M  Em7(5-)', 'C',
          ['E', 'gri', 'tam', 'nos', 'mer', 'ca', 'dos', 'que', 'com', 'cer', 'te', 'za'],
          ['dó#', 'ré', 'mi', 'ré', 'dó#', 'mi', 'mi', 'mi', 'mi', 'mi', 'mi', 'mi']),
        L('A7(13-)  Dm  Dm7M  Dm7', 'F',
          ['Es', 'tá', 'na', 'na', 'tu', 're', 'za,', 'se', 'rá,', 'que', 'se', 'rá?'],
          ['lá', 'dó', 'ré', 'dó', 'lá', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré']),
        L('Dm6  Bbm  Bbm7M  Bbm7', 'G',
          ['O', 'que', 'não', 'tem', 'cer', 'te', 'za,', 'nem', 'nun', 'ca', 'te', 'rá'],
          ['dó#', 'ré', 'mi', 'ré', 'dó#', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré']),
        L('Bbm6  F/A  Abº  Gm7', 'G',
          ['O', 'que', 'não', 'tem', 'con', 'ser', 'to,', 'nem', 'nun', 'ca', 'te', 'rá'],
          ['dó#', 'ré', 'mi', 'ré', 'dó#', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré']),
        L('A7(13-)  Dm  A7(13-)', 'H',
          ['O', 'que', 'não', 'tem', 'ta', 'ma', 'nho'],
          ['si', 'dó#', 'ré', 'dó#', 'si', 'ré', 'si'])
      ]
    },
    {
      id: 'e2', title: 'Estrofe 2 — centro em Dm', center: 'Dm',
      lines: [
        L('Dm  Dm7M  Dm7', 'hook',
          ['O', 'que', 'se', 'rá,', 'que', 'se', 'rá'],
          ['lá', 'lá', 'dó', 'ré', 'fá', 'ré', 'fá']),
        L('Dm6  Am  Am7M  Am7', 'A',
          ['Que', 'vi', 've', 'nas', 'i', 'dé', 'ias', 'des', 'ses', 'a', 'man', 'tes'],
          ['ré', 'mi', 'fá#', 'mi', 'ré', 'fá#', 'mi', 'ré', 'fá#', 'mi', 'ré', 'lá']),
        L('Am6  Gm  Gm7M  Gm7', 'B',
          ['Que', 'can', 'tam', 'os', 'po', 'e', 'tas', 'mais', 'de', 'li', 'ran', 'tes'],
          ['ré', 'mi', 'fá#', 'mi', 'ré', 'lá', 'lá', 'lá', 'lá', 'lá', 'lá', 'lá']),
        L('Gm6  Bbm  Bbm7M  Em7(5-)', 'C',
          ['Que', 'ju', 'ram', 'os', 'pro', 'fe', 'tas', 'em', 'bri', 'a', 'ga', 'dos'],
          ['dó#', 'ré', 'mi', 'ré', 'dó#', 'mi', 'mi', 'mi', 'mi', 'mi', 'mi', 'mi']),
        L('A7(13-)  Dm  Dm7M  Dm7', 'D',
          ['Que', 'es', 'tá', 'na', 'ro', 'ma', 'ria', 'dos', 'mu', 'ti', 'la', 'dos'],
          ['ré', 'mi', 'fá#', 'mi', 'ré', 'LÁ', 'LÁ', 'LÁ', 'LÁ', 'LÁ', 'LÁ', 'LÁ']),
        L('Dm6  Am  Am7M  Am7', 'A',
          ['Que', 'es', 'tá', 'na', 'fan', 'ta', 'sia', 'dos', 'in', 'fe', 'li', 'zes'],
          ['ré', 'mi', 'fá#', 'mi', 'ré', 'fá#', 'mi', 'ré', 'fá#', 'mi', 'ré', 'lá']),
        L('Am6  Gm  Gm7M  Gm7', 'B',
          ['Que', 'es', 'tá', 'no', 'di', 'a', 'a', 'di', 'a', 'das', 'me', 're', 'trizes'],
          ['ré', 'mi', 'fá#', 'mi', 'ré', 'lá', 'lá', 'lá', 'lá', 'lá', 'lá', 'lá', 'lá']),
        L('Gm6  Bbm  Bbm7M  Em7(5-)', 'C',
          ['No', 'pla', 'no', 'dos', 'ban', 'di', 'dos,', 'dos', 'des', 'va', 'li', 'dos'],
          ['dó#', 'ré', 'mi', 'ré', 'dó#', 'mi', 'mi', 'mi', 'mi', 'mi', 'mi', 'mi']),
        L('A7(13-)  Dm  Dm7M  Dm7', 'F',
          ['Em', 'to', 'dos', 'os', 'sen', 'ti', 'dos,', 'se', 'rá,', 'que', 'se', 'rá?'],
          ['lá', 'dó', 'ré', 'dó', 'lá', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré']),
        L('Dm6  Bbm  Bbm7M  Bbm7', 'G',
          ['O', 'que', 'não', 'tem', 'de', 'cên', 'cia,', 'nem', 'nun', 'ca', 'te', 'rá'],
          ['dó#', 'ré', 'mi', 'ré', 'dó#', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré']),
        L('Bbm6  F/A  Abº  Gm7', 'G',
          ['O', 'que', 'não', 'tem', 'cen', 'su', 'ra,', 'nem', 'nun', 'ca', 'te', 'rá'],
          ['dó#', 'ré', 'mi', 'ré', 'dó#', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré']),
        L('A7(13-)  Dm  D7', 'H',
          ['O', 'que', 'não', 'faz', 'sen', 'ti', 'do'],
          ['si', 'dó#', 'ré', 'dó#', 'si', 'ré', 'si'])
      ]
    },
    {
      id: 'e3', title: 'Estrofe 3 — ponte (harmonia em Gm)', center: 'Gm',
      lines: [
        L('Gm  Gm7M  Gm7', 'hook',
          ['O', 'que', 'se', 'rá,', 'que', 'se', 'rá'],
          ['lá', 'lá', 'dó', 'ré', 'fá', 'ré', 'fá']),
        L('Gm6  Dm  Dm7M  Dm7', 'A',
          ['Que', 'to', 'dos', 'os', 'a', 'vi', 'sos', 'não', 'vão', 'e', 'vi', 'tar'],
          ['ré', 'mi', 'fá#', 'mi', 'ré', 'fá#', 'mi', 'ré', 'fá#', 'mi', 'ré', 'lá']),
        L('Abº  Cm  Cm7M  Cm7', 'B',
          ['Por', 'que', 'to', 'dos', 'os', 'ri', 'sos', 'vão', 'de', 'sa', 'fi', 'ar'],
          ['ré', 'mi', 'fá#', 'mi', 'ré', 'lá', 'lá', 'lá', 'lá', 'lá', 'lá', 'lá']),
        L('Cm6  Ebm  Ebm7M  Am7(5-)', 'C',
          ['Por', 'que', 'to', 'dos', 'os', 'si', 'nos', 'i', 'rão', 're', 'pi', 'car'],
          ['dó#', 'ré', 'mi', 'ré', 'dó#', 'mi', 'mi', 'mi', 'mi', 'mi', 'mi', 'mi']),
        L('D7(9-)  Gm  Gm7M  Gm7', 'D',
          ['Por', 'que', 'to', 'dos', 'os', 'hi', 'nos', 'i', 'rão', 'con', 'sa', 'grar'],
          ['ré', 'mi', 'fá#', 'mi', 'ré', 'LÁ', 'LÁ', 'LÁ', 'LÁ', 'LÁ', 'LÁ', 'LÁ']),
        L('Gm6  Dm  Dm7M  Dm7', 'A',
          ['E', 'to', 'dos', 'os', 'me', 'ni', 'nos', 'vão', 'de', 'sem', 'bes', 'tar'],
          ['ré', 'mi', 'fá#', 'mi', 'ré', 'fá#', 'mi', 'ré', 'fá#', 'mi', 'ré', 'lá']),
        L('G7/B  Cm  Cm7M  Cm7', 'E',
          ['E', 'to', 'dos', 'os', 'des', 'ti', 'nos', 'i', 'rão', 'se', 'en', 'con', 'trar'],
          ['fá#', 'dó', 'ré', 'dó', 'fá#', 'dó', 'dó', 'dó', 'dó', 'dó', 'dó', 'dó', 'dó']),
        L('Cm6  Ebm  Ebm7M  Am7(5-)', 'E',
          ['E', 'mes', 'mo', 'o', 'Pa', 'dre', 'E', 'ter', 'no', 'que', 'nun', 'ca', 'foi', 'lá'],
          ['mi', 'dó#', 'ré', 'dó#', 'mi', 'dó', 'dó', 'dó', 'dó', 'dó', 'dó', 'dó', 'dó', 'dó']),
        L('D7(9-)  Gm  Gm7M  Gm7', 'F',
          ['O', 'lhan', 'do', 'a', 'que', 'le', 'in', 'fer', 'no,', 'vai', 'a', 'ben', 'ço', 'ar'],
          ['lá', 'dó', 'ré', 'dó', 'lá', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré']),
        L('Gm6  Ebm  Ebm7M  Ebm7', 'G',
          ['O', 'que', 'não', 'tem', 'go', 'ver', 'no,', 'nem', 'nun', 'ca', 'te', 'rá'],
          ['dó#', 'ré', 'mi', 'ré', 'dó#', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré']),
        L('Ebm6  Bb/D  C#º  Cm7', 'G',
          ['O', 'que', 'não', 'tem', 'ver', 'go', 'nha,', 'nem', 'nun', 'ca', 'te', 'rá'],
          ['dó#', 'ré', 'mi', 'ré', 'dó#', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré']),
        L('D7  Gm  E7', 'H',
          ['O', 'que', 'não', 'tem', 'ju', 'í', 'zo'],
          ['si', 'dó#', 'ré', 'dó#', 'si', 'ré', 'si'])
      ]
    },
    {
      id: 'e4', title: 'Estrofe 4 — reprise (harmonia Dm)', center: 'Dm',
      lines: [
        L('Dm  Dm7M  Dm7', 'hook',
          ['O', 'que', 'se', 'rá,', 'que', 'se', 'rá'],
          ['lá', 'lá', 'dó', 'ré', 'fá', 'ré', 'fá']),
        L('Dm6  Am  Am7M  Am7', 'A',
          ['Que', 'to', 'dos', 'os', 'a', 'vi', 'sos', 'não', 'vão', 'e', 'vi', 'tar'],
          ['ré', 'mi', 'fá#', 'mi', 'ré', 'fá#', 'mi', 'ré', 'fá#', 'mi', 'ré', 'lá']),
        L('Am6  Gm  Gm7M  Gm7', 'B',
          ['Por', 'que', 'to', 'dos', 'os', 'ri', 'sos', 'vão', 'de', 'sa', 'fi', 'ar'],
          ['ré', 'mi', 'fá#', 'mi', 'ré', 'lá', 'lá', 'lá', 'lá', 'lá', 'lá', 'lá']),
        L('Gm6  Bbm  Bbm7M  Em7(5-)', 'C',
          ['Por', 'que', 'to', 'dos', 'os', 'si', 'nos', 'i', 'rão', 're', 'pi', 'car'],
          ['dó#', 'ré', 'mi', 'ré', 'dó#', 'mi', 'mi', 'mi', 'mi', 'mi', 'mi', 'mi']),
        L('A7(13-)  Dm  Dm7M  Dm7', 'D',
          ['Por', 'que', 'to', 'dos', 'os', 'hi', 'nos', 'i', 'rão', 'con', 'sa', 'grar'],
          ['ré', 'mi', 'fá#', 'mi', 'ré', 'LÁ', 'LÁ', 'LÁ', 'LÁ', 'LÁ', 'LÁ', 'LÁ']),
        L('Dm6  Am  Am7M  Am7', 'A',
          ['E', 'to', 'dos', 'os', 'me', 'ni', 'nos', 'vão', 'de', 'sem', 'bes', 'tar'],
          ['ré', 'mi', 'fá#', 'mi', 'ré', 'fá#', 'mi', 'ré', 'fá#', 'mi', 'ré', 'lá']),
        L('Am6  Gm  Gm7M  Gm7', 'E',
          ['E', 'to', 'dos', 'os', 'des', 'ti', 'nos', 'i', 'rão', 'se', 'en', 'con', 'trar'],
          ['fá#', 'dó', 'ré', 'dó', 'fá#', 'dó', 'dó', 'dó', 'dó', 'dó', 'dó', 'dó', 'dó']),
        L('Gm6  Bbm  Bbm7M  Em7(5-)', 'E',
          ['E', 'mes', 'mo', 'o', 'Pa', 'dre', 'E', 'ter', 'no', 'que', 'nun', 'ca', 'foi', 'lá'],
          ['mi', 'dó#', 'ré', 'dó#', 'mi', 'dó', 'dó', 'dó', 'dó', 'dó', 'dó', 'dó', 'dó', 'dó']),
        L('A7(13-)  Dm  Dm7M  Dm7', 'F',
          ['O', 'lhan', 'do', 'a', 'que', 'le', 'in', 'fer', 'no,', 'vai', 'a', 'ben', 'ço', 'ar'],
          ['lá', 'dó', 'ré', 'dó', 'lá', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré']),
        L('Dm6  Bbm  Bbm7M  Bbm7', 'G',
          ['O', 'que', 'não', 'tem', 'go', 'ver', 'no,', 'nem', 'nun', 'ca', 'te', 'rá'],
          ['dó#', 'ré', 'mi', 'ré', 'dó#', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré']),
        L('Bbm6  F/A  Abº  Gm7', 'G',
          ['O', 'que', 'não', 'tem', 'ver', 'go', 'nha,', 'nem', 'nun', 'ca', 'te', 'rá'],
          ['dó#', 'ré', 'mi', 'ré', 'dó#', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré', 'ré']),
        L('A7(13-)  Dm  G7(13)', 'H',
          ['O', 'que', 'não', 'tem', 'ju', 'í', 'zo'],
          ['si', 'dó#', 'ré', 'dó#', 'si', 'ré', 'si'])
      ]
    }
  ];

  function normNote(n) {
    return n.toLowerCase().replace('á', 'á').replace('Á', 'á');
  }

  function noteToMidi(note) {
    const n = normNote(note);
    if (NOTE_MIDI[n] !== undefined) return NOTE_MIDI[n];
    if (n === 'lá') return NOTE_MIDI['lá'];
    return 60;
  }

  function flattenEvents(stanzas, opts) {
    const gap = (opts && opts.lineGap) || 0.25;
    const events = [];
    let t = 0;
    stanzas.forEach((stanza) => {
      stanza.lines.forEach((line) => {
        line.syllables.forEach((syl) => {
          events.push({
            start: t,
            dur: syl.dur,
            midi: noteToMidi(syl.note),
            note: normNote(syl.note),
            text: syl.text
          });
          t += syl.dur;
        });
        t += gap;
      });
      t += 0.5;
    });
    return events;
  }

  /* ── SMF writer (Format 0, single track) ── */
  function writeVarLen(n) {
    const bytes = [n & 0x7f];
    let v = n >> 7;
    while (v > 0) {
      bytes.unshift((v & 0x7f) | 0x80);
      v >>= 7;
    }
    return bytes;
  }

  function buildMidiBytes(events, bpm) {
    const tpq = 480;
    const usPerQ = Math.round(60000000 / bpm);
    const track = [];

    function pushDelta(sec) {
      const ticks = Math.max(0, Math.round(sec * tpq * bpm / 60));
      track.push(...writeVarLen(ticks));
    }

    function pushMsg(bytes) {
      track.push(...bytes);
    }

    pushDelta(0);
    pushMsg([0xff, 0x51, 0x03, (usPerQ >> 16) & 0xff, (usPerQ >> 8) & 0xff, usPerQ & 0xff]);
    pushDelta(0);
    pushMsg([0xc0, 0x00]);
    pushDelta(0);
    pushMsg([0xff, 0x03]);
    const title = 'O Que Sera - melodia vocal Dm';
    pushMsg([title.length]);
    track.push(...[...title].map((c) => c.charCodeAt(0)));

    let last = 0;
    events.forEach((ev) => {
      const startSec = ev.start;
      const durSec = ev.dur;
      pushDelta(startSec - last);
      pushMsg([0x90, ev.midi, 0x5a]);
      pushDelta(durSec);
      pushMsg([0x80, ev.midi, 0x40]);
      last = startSec + durSec;
    });

    pushDelta(0);
    pushMsg([0xff, 0x2f, 0x00]);

    const header = [
      0x4d, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06,
      0x00, 0x00, 0x00, 0x01, (tpq >> 8) & 0xff, tpq & 0xff
    ];
    const trackLen = track.length;
    const trackChunk = [
      0x4d, 0x54, 0x72, 0x6b,
      (trackLen >> 24) & 0xff, (trackLen >> 16) & 0xff, (trackLen >> 8) & 0xff, trackLen & 0xff,
      ...track
    ];
    return new Uint8Array([...header, ...trackChunk]);
  }

  function renderStanza(stanza) {
    const lines = stanza.lines.map((line) => {
      const motif = MOTIF_LABELS[line.motif] || line.motif;
      const cells = line.syllables.map((s) => {
        const cls = NOTE_CLASS[normNote(s.note)] || 'n-x';
        const strong = s.note === s.note.toUpperCase();
        return `<span class="syl ${cls}${strong ? ' syl-strong' : ''}" data-note="${normNote(s.note)}">
          <span class="syl-note">${s.note}</span>
          <span class="syl-text">${s.text}</span>
        </span>`;
      }).join('');
      const lyric = line.syllables.map((s) => s.text).join(' ');
      return `<article class="melody-line card" data-motif="${line.motif}">
        <div class="chord-row"><span class="chord-label">${line.chords}</span>
          <span class="motif-tag">${motif}</span></div>
        <div class="syl-row" role="list">${cells}</div>
        <p class="lyric-full">${lyric}</p>
      </article>`;
    }).join('');
    return `<section id="${stanza.id}" class="stanza-section">
      <h2>${stanza.title}</h2>
      <p class="stanza-meta">Centro harmônico: <strong>${stanza.center}</strong></p>
      ${lines}
    </section>`;
  }

  let audioCtx = null;
  let playing = false;
  let stopTimer = null;

  function playEvents(events, bpm, onStatus) {
    if (playing) return;
    playing = true;
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;
    const now = ctx.currentTime + 0.1;
    events.forEach((ev) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 440 * Math.pow(2, (ev.midi - 69) / 12);
      const t0 = now + ev.start;
      const t1 = t0 + ev.dur;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.22, t0 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t1 + 0.05);
    });
    const total = events.length ? events[events.length - 1].start + events[events.length - 1].dur : 0;
    if (onStatus) onStatus(`Tocando melodia (~${Math.ceil(total)}s)`);
    stopTimer = setTimeout(() => {
      playing = false;
      if (onStatus) onStatus('Pronto.');
    }, (total + 1) * 1000);
  }

  function stopPlayback(onStatus) {
    if (stopTimer) clearTimeout(stopTimer);
    playing = false;
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
    if (onStatus) onStatus('Parado.');
  }

  function downloadMidi(bytes, filename) {
    const blob = new Blob([bytes], { type: 'audio/midi' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function initPage() {
    const root = document.getElementById('stanzas-root');
    if (root) root.innerHTML = STANZAS.map(renderStanza).join('');

    const bpm = 120;
    const events = flattenEvents(STANZAS);
    const midiBytes = buildMidiBytes(events, bpm);
    const status = document.getElementById('player-status');

    const playBtn = document.getElementById('btn-play');
    const stopBtn = document.getElementById('btn-stop');
    const dlBtn = document.getElementById('btn-download-midi');

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        stopPlayback();
        playEvents(events, bpm, (m) => { if (status) status.textContent = m; });
      });
    }
    if (stopBtn) {
      stopBtn.addEventListener('click', () => stopPlayback((m) => { if (status) status.textContent = m; }));
    }
    if (dlBtn) {
      dlBtn.addEventListener('click', () => {
        downloadMidi(midiBytes, 'o-que-sera-melodia-dm.mid');
        if (status) status.textContent = 'Download iniciado (.mid)';
      });
    }

    const meta = document.getElementById('midi-meta');
    if (meta) {
      meta.textContent = `${events.length} notas · ${(midiBytes.length / 1024).toFixed(1)} KB · ${bpm} BPM`;
    }
  }

  global.OQueSeraMelodia = {
    STANZAS,
    NOTE_MIDI,
    NOTE_CLASS,
    MOTIF_LABELS,
    flattenEvents,
    buildMidiBytes,
    initPage
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initPage);
    } else {
      initPage();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
