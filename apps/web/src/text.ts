/** Sin tildes y en minúsculas, para buscar sin importar cómo se escriba ("pina" encuentra "Piña"). */
export const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
