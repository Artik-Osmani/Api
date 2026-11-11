# Detyra 2 — Branch direkt nga main (Etnik Haziri)

Ky dokumentacion përshkruan detyrën 2 të ushtrimit në grup.

## Hapat

1. U krijua branch-i `etnik-detyra-2-main` **direkt nga `main`**.
2. U bënë ndryshime të vogla:
   - `wwwroot/index.html`: dy opsionet mungojnë në shkallëzimin e recensionit
     (⭐ 2 - Poor, ⭐ 1 - Bad). API-ja (`POST /v1/listings/{id}/reviews`)
     pranon vlerësim 1–5, por UI-ja ndalonte te 3, kështu që përvoja me
     vlerësim të ulët nuk mund të raportohej.
   - ky skedar dokumentues.
3. U bë merge në `main` përmes pull request-it.

## Kufizimi kryesor

Ky ndryshim **nuk e prek** branch-in `Dev` as `qa` — merge bëhet vetëm
drejt `main`, ashtu siç kërkon detyra.
