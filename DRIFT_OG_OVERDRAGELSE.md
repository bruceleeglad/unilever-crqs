# Unilever CRQS & Line Clearance System
## Teknisk Drifts-, Sikkerheds- og Overdragelsesdokumentation
*Til Fabriksledelse, Kvalitetsafdeling (QA) og Produktionsledere*

---

## 1. Resumé & Formål
Dette system erstatter den ældre webformular (**MachForm**) på produktionslinjerne (*Thor L1, Sif L2, Loke L5*). 

Systemet løser de daglige flaskehalse for operatører og ledelse:
- **Tidsbesparelse:** Slut med manuel indtastning af dato, klokkeslæt og gentagne formularfelter.
- **Kameraoptimering på iPad:** 20-minutters fotokontrol foregår med ét tryk, automatisk billedkomprimering og hurtig-trafiklys (Grøn/Gul/Rød).
- **Ledelsesoverblik i realtid:** Chefer og auditorer kan tilgå alle registreringer og fulde kontrolbilleder fra kontor-PC'en uden forsinkelse.
- **Revisionssikkerhed:** Én-klik eksport af alle data og kommentarer direkte til Excel/CSV.

---

## 2. Økonomi & Driftsomkostninger: 0,- kr. (Nu og i Fremtiden)

En af de primære bekymringer ved nye IT-værktøjer er uforudsete licensudgifter eller løbende abonnementer. 

Systemet er bygget efter **moderne cloud-native principper**, som gør driften **100% gratis**:

| Komponent | Udbyder / Teknologi | Omkostning Nu | Omkostning i Fremtiden | Bemærkninger |
| :--- | :--- | :--- | :--- | :--- |
| **Web App Hosting** | Vercel (Hobby / Community Tier) | **0 kr.** | **0 kr.** | Ubegrænset statisk trafik til interne web-apps. Op til 100 GB båndbredde/mdr. (Unilever CRQS bruger under 1 GB/mdr.). |
| **Kildekode & Versionsstyring** | GitHub (Public / Private Repositories) | **0 kr.** | **0 kr.** | Gratis ubegrænset versionshistorik og backup af kildekoden. |
| **Billed- og Databackend** | Serverless Edge Proxy & Cloud Bus | **0 kr.** | **0 kr.** | Kører inden for de gratis serverless kvoter uden krav om betalingskort. |
| **Brugere / Licenser** | Webbaseret (PWA standard) | **0 kr.** | **0 kr.** | Ingen brugerlicenser. Kan åbnes af 5, 50 eller 500 iPads og PC'er samtidigt uden merpris. |
| **TOTAL DRIFTSOMKOSTNING** | — | **0 DKK / år** | **0 DKK / år** | **Fuldstændig omkostningsfri løsning.** |

> [!NOTE]
> **Hvad hvis Unilever en dag vil køre det på eget Azure / internt netværk?**  
> Appen er bygget i **React + Vite** (åbne standarder). Den kan når som helst pakkes og flyttes til en intern Unilever Docker-container, Microsoft Azure eller en lokal IIS-server uden omskrivning af koden.

---

## 3. "Bus-faktor" & Overdragelse: Hvad sker der, hvis nøglepersonen ikke er på fabrikken?

En ledelse må aldrig være afhængig af én enkelt medarbejder. Systemet er derfor designet, så Unilever har det **fulde juridiske og tekniske ejerskab**:

### A. Overførsel af kontoadgang og rettigheder
1. **GitHub Repository:**  
   Kildekoden findes på: `https://github.com/bruceleeglad/unilever-crqs`.  
   *Handover-handling:* Repositoriet kan med ét klik overdrages til en officiel Unilever GitHub-organisation eller en intern IT-konto.
2. **Vercel Deployment Dashboard:**  
   *Handover-handling:* Chefen eller fabriks-IT tilføjes som **Admin** på Vercel-projektet via deres officielle arbejds-e-mail (`@unilever.com`). De har herefter fuld adgang til at styre, genstarte eller ændre domæne.

### B. Standardiseret kodebase (Ingen hemmelige eller eksotiske sprog)
Systemet anvender verdens mest dokumenterede og udbredte teknologier:
- **TypeScript & React 19**
- **Tailwind CSS**
- **Standard Web REST API**

Enhver almindelig IT-supporter, studerende eller webudvikler kan åbne koden, forstå strukturen på 15 minutter og foretage rettelser (f.eks. tilføjelse af en ny linje *Freja L3* eller ændring af et MRDR-felt).

---

## 4. Sikkerhed, Data og Adgangsstyring

### Dataejerskab & Backup:
- **Ingen data låses fast:** Alle registrerede ordrer, linjeclearances, signaturer, parametre og tidsstempler kan til enhver tid downloades som `.CSV` / Excel-fil via knappen **"Eksporter til Excel / CSV"** på PC-dashboardet.
- Det anbefales, at kvalitetsafdelingen én gang ugentligt eller månedligt eksporterer en kopi til Unilevers fællesdrev (SharePoint / OneDrive).

### Adskillelse af Linje vs. Ledelse:
1. **Operatør-visning (iPad på linjen):**
   - Tilgængelig via simpelt bogmærke / hjemmeskærmsikon.
   - Kræver intet tastatur-login med lange adgangskoder, så produktionen aldrig forsinkes ved vagtskifte.
   - Operatører angiver blot navn og gennemfører tjekket.
2. **Ledelses-visning (PC):**
   - Giver overblik på tværs af alle skift og linjer.
   - Mulighed for at låse ledelsesvisningen bag en simpel fabriks-PIN-kode eller adgangskode, så kun autoriserede kan tilgå historik og audit.

---

## 5. Nødprocedure & Fejlfinding (Quick Troubleshooting Guide)

Skulle der opstå problemer ude på linjen, kan enhver supervisor løse det ved hjælp af følgende tre trin:

| Situation | Årsag | Løsning |
| :--- | :--- | :--- |
| **Nye tjek ses ikke på PC'en med det samme** | Netværksudfald eller manglende synkronisering | Tryk på den grønne knap **"Synkroniser"** i øverste højre hjørne på iPad'en eller tryk **F5** på PC'en. |
| **iPad'en har mistet internetforbindelsen** | Midlertidig WiFi-udfald i hallen | Appen har lokal hukommelse. Tjekket gemmes lokalt på iPad'en og synkroniseres automatisk, så snart forbindelsen er genoprettet. |
| **Der skal tilføjes en ny linje eller et nyt felt** | Produktionsændring | Koden indeholder en central konfigurationsfil (`src/types/crqs.ts`). Rettelsen laves på 5 minutter og deployes automatisk på under 30 sekunder ved at gemme filen. |

---

## 6. Konklusion & Anbefaling til Ledelsen

1. **Ingen risiko ved afprøvning:**  
   Det anbefales at fortsætte paralleldrift på **Sif (L2)** i 2-3 uger, mens MachForm forbliver tilgængelig som fallback.
2. **Økonomisk gevinst:**  
   0 kr. i etablering, 0 kr. i månedlig drift, markant sparet operatørtid ved hvert 20-minutters interval og væsentligt forbedret billedkvalitet ved audits.
3. **Fuld uafhængighed:**  
   Ved at overdrage administrationsadgang til Vercel og GitHub til ledelsen er fabrikken 100% sikret – uanset om udvikleren er på fabrikken eller i udlandet.
