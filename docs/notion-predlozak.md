# Predložak „Nova objava"

Notion ne dopušta da se predložak napravi iz koda — mora se jednom složiti
rukom u sučelju. Ovaj dokument je izvor istine za ono što u njemu piše, da se
može ponovno složiti ako se izgubi.

## Kako ga napraviti

1. Otvori bazu **Objave**.
2. Uz plavi gumb **New** klikni strelicu **⌄** → **New template**.
3. Predložak nazovi **Nova objava**.
4. Postavi polja i tijelo kako je opisano niže.
5. Zatvori predložak. Uz strelicu ⌄ ponovno → kraj „Nova objava" klikni **•••**
   → **Set as default** za sve nove stranice.

Nakon toga svaka autorica klikne **New** i dobije praznu, ispravno posloženu
objavu.

## Polja koja predložak popunjava unaprijed

| Polje | Vrijednost u predlošku | Zašto |
| --- | --- | --- |
| Status | `Skica` | Ništa se ne objavljuje dok autorica sama ne prebaci na `Za objavu`. |
| Kategorija | `Book club` | Najčešći slučaj; mijenja se u dva klika. |
| Datum objave | *(prazno)* | Ostaje prazno namjerno — vidi niže. |
| Naslov, Autor, Sažetak | *(prazno)* | Popunjava autorica. |
| Slug | *(prazno)* | Adresa se sama izvodi iz naslova. |
| Objavljeno na | *(prazno)* | Upisuje se sam kad objava ode na stranicu. |

`Datum objave` ostaje prazan jer bi ga predložak zamrznuo na dan kad je
predložak napravljen, a ne na dan kad se objava piše. Ako ostane prazan, uzima
se datum nastanka stranice.

## Status

Status je jedino čime se objavljuje. Ništa drugo ne treba dirati.

| Status | Što se događa |
| --- | --- |
| `Skica` | Ništa. Piši koliko god dugo treba. |
| `Za objavu` | Objava odlazi na stranicu u sljedećoj sinkronizaciji. |
| `Objavljeno` | Upisuje se sam kad objava ode na stranicu — ne postavlja se ručno. |
| `Skriveno` | Objava se miče sa stranice. |

`Skriveno` briše objavu sa stranice, ali ne i iz Notiona — tekst i slike ostaju
ovdje netaknuti. Ako je vratiš na `Za objavu`, objava se vraća na **istu adresu**
kao prije, čak i ako si joj u međuvremenu promijenila naslov. Zato polje
`Objavljeno na` ostaje popunjeno i dok je objava skrivena: to je jedini zapis o
tome gdje je bila.

Objava koja nikad nije bila na stranici može se slobodno staviti na `Skriveno` —
neće se dogoditi ništa.

## Naslovna slika

U predložak se ne može staviti slika, ali se može staviti podsjetnik. Naslovnu
sliku autorica dodaje sama:

- **Add cover** na vrhu stranice, ili
- polje **Naslovna slika**.

Bez nje objava neće proći i autorica će dobiti komentar na stranicu.

## Tijelo predloška

Sve ispod je običan tekst osim naslova, koji su **Heading 2** (`##`).

---

> Kratki uvod: koju smo knjigu čitali i kad. Dvije-tri rečenice.

## Knjiga i autor

> Nekoliko rečenica o knjizi i o tome tko ju je napisao. Ako je autor već bio
> na našim susretima, spomeni to.

## Naši dojmovi

> Što nam se svidjelo, što nas je smetalo, oko čega smo se podijelile.
> Slobodno citiraj članice.

## Omiljeni citat

> Citat iz knjige. Označi ga kao *quote* (upiši `"` pa razmak na početku retka).

---

> Zadnji redak: što čitamo sljedeći put i kad se vidimo.

## Što se neće prenijeti na stranicu

Ovi blokovi rade u Notionu, ali ih stranica ne prikazuje, pa ih predložak
namjerno ne koristi:

- tablice
- matematičke formule
- sadržaj (*table of contents*), *breadcrumb*
- sinkronizirani blokovi
- podstranice i baze unutar stranice

Ako ih ipak upotrijebiš, objava će proći — samo taj dio neće biti na stranici.
Tekst oko njega ostaje netaknut.
