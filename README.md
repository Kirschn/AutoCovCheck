# AutoCovCheck

Ziel des Projektes ist die Entwicklung eines kontrollierten, vollautomatierten Einlasssystem zur Überprüfung von Digital Covid Certificates der Europäischen Union.

Das Projekt ist vollständig in Node.js als ES6 Modul implementiert. Es kann daher auf jeder Plattform eingesetzt werden. Das Modul für physikalischen Output ist derzeit nur für den Raspberry Pi implementiert. Wenn das Feature zum Protokoll der Einlassdaten zur Kontaktnachverfolgung deaktiviert ist, werden *keine* Daten der Personen gespeichert. Es erfolgt lediglich eine Zwischenspeicherung im Arbeitsspeicher zur Validierung der Daten. Die zwischengespeicherten Daten werden fünf Sekunden nach Einlass aus dem Arbeitsspeicher gelöscht und ggf. bei aktvierter Kontaktnachverfolgung in der lokalen Datenbank auf dem Gerät gespeichert (Vor- und Nachname sowie Geburtsdatum).

## Features
 - Automatisches Scannen von DCC QR Codes
 - Validierung der Zertifikate durch die öffentlichen Schlüssel der ausstellenden Institutionen (RKI in Deutschland)
 - Frei konfigurierbare Einlassregeln (Einlass mit Impfung, Genesung, PCR Test, Antigen Test, Benötigung eines zusätzlichen Antigen Tests, etc.)
 - (raspberry pi only) Automatische Signalausgabe an Türbolzen o.Ä. für vollautomatisierten Einlass
 - Deaktivierbares Protokoll von Name und Geburtsdatum zur Kontaktnachverfolgung

