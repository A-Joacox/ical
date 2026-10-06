import { useState } from 'react'
import { Block, BlockTitle, Button, Link, List, ListButton, ListItem, NavbarBackLink, Page, Popup, Preloader, Searchbar } from 'konsta/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { PencilLine, ScanBarcode } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api'
import { Navbar } from '../../ui/Navbar'
import { lookupBarcode, searchFoods, type FoodResult } from './api'
import { BarcodeScanner } from './BarcodeScanner'
import { addEntry, createFood, findFoodByBarcode, getRecentFoods, saveFoodResult, searchLocalFoods } from './data'
import { FoodForm } from './FoodForm'
import { PortionForm } from './PortionForm'
import type { Food, Meal } from './types'

type View = 'search' | 'scan' | 'create' | 'portion'
// Un alimento ya guardado en el iPhone o un resultado del server (se guarda al añadirlo).
type Choice = Food | FoodResult
type Online = { query: string; results?: FoodResult[]; error?: string }

const keyOf = (food: Choice) => ('id' in food ? food.id : `${food.source}:${food.sourceId}`)

type Props = { opened: boolean; meal: Meal; date: string; onClose: () => void }

// Añadir a una comida: recientes, búsqueda (en el iPhone y en internet), código de barras o alimento propio.
export function AddFoodPopup({ opened, meal, date, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'es'
  const [view, setView] = useState<View>('search')
  const [query, setQuery] = useState('')
  const [online, setOnline] = useState<Online | null>(null)
  const [choice, setChoice] = useState<Choice | null>(null)
  const [barcode, setBarcode] = useState<string>()
  const [scanned, setScanned] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const recents = useLiveQuery(() => (opened ? getRecentFoods() : []), [opened])
  const q = query.trim()
  const local = useLiveQuery(() => (q ? searchLocalFoods(q) : []), [q])

  const close = () => {
    setView('search')
    setQuery('')
    setOnline(null)
    setChoice(null)
    setNotice(null)
    onClose()
  }
  const show = (next: View) => {
    setNotice(null)
    setScanned(null)
    setView(next)
  }
  const pick = (food: Choice) => {
    setChoice(food)
    show('portion')
  }

  const errorText = (error: unknown) =>
    error instanceof ApiError
      ? t(error.status === 401 ? 'food.needSession' : 'food.apiUnavailable')
      : t('food.offline')

  const searchOnline = async () => {
    if (!q) return
    setOnline({ query: q })
    try {
      setOnline({ query: q, results: await searchFoods(q, lang) })
    } catch (error) {
      setOnline({ query: q, error: errorText(error) })
    }
  }

  // Primero en el iPhone (funciona sin conexión), luego en Open Food Facts; si no está, a crearlo.
  const onBarcode = async (code: string) => {
    setScanned(code)
    const saved = await findFoodByBarcode(code)
    if (saved) return pick(saved)
    try {
      pick(await lookupBarcode(code, lang))
    } catch (error) {
      const notFound = error instanceof ApiError && error.status === 404
      setBarcode(code)
      show(notFound ? 'create' : 'search')
      setNotice(notFound ? t('food.barcodeNotFound') : errorText(error))
    }
  }

  const add = async (grams: number, chosenMeal: Meal) => {
    if (!choice) return
    const food = 'id' in choice ? choice : await saveFoodResult(choice)
    await addEntry(food, grams, chosenMeal, date)
    close()
  }

  const titles = { search: t('food.addTo', { meal: t(`food.meals.${meal}`) }), scan: t('food.scanTitle'), create: t('food.newFood'), portion: t('food.portion') }

  return (
    <Popup opened={opened} onBackdropClick={close}>
      <Page>
        <Navbar
          title={titles[view]}
          left={view !== 'search' && <NavbarBackLink text={t('food.back')} onClick={() => show('search')} />}
          right={<Link onClick={close}>{t('gym.close')}</Link>}
          subnavbar={
            view === 'search' && (
              <Searchbar
                component="form"
                placeholder={t('food.searchPlaceholder')}
                value={query}
                clearButton
                onInput={(event) => setQuery(event.target.value)}
                onClear={() => setQuery('')}
                onSubmit={(event: React.FormEvent) => {
                  event.preventDefault()
                  searchOnline()
                }}
              />
            )
          }
        />

        {view === 'search' && opened && (
          <>
            <Block className="grid grid-cols-2 gap-3">
              <Button large rounded tonal onClick={() => show('scan')}>
                <ScanBarcode className="mr-1.5 h-5 w-5" />
                {t('food.scan')}
              </Button>
              <Button
                large
                rounded
                tonal
                onClick={() => {
                  setBarcode(undefined)
                  show('create')
                }}
              >
                <PencilLine className="mr-1.5 h-5 w-5" />
                {t('food.create')}
              </Button>
            </Block>
            {notice && <Block className="text-center text-[15px] text-label-2">{notice}</Block>}

            {!q ? (
              recents?.length ? (
                <>
                  <BlockTitle>{t('food.recents')}</BlockTitle>
                  <FoodList foods={recents} onPick={pick} />
                </>
              ) : (
                <Block className="text-center text-[15px] text-label-2">{t('food.emptyHint')}</Block>
              )
            ) : (
              <>
                {!!local?.length && (
                  <>
                    <BlockTitle>{t('food.myFoods')}</BlockTitle>
                    <FoodList foods={local} onPick={pick} />
                  </>
                )}
                <BlockTitle>{t('food.online')}</BlockTitle>
                {online?.query !== q ? (
                  <List strong inset>
                    <ListButton onClick={searchOnline}>{t('food.searchOnline', { query: q })}</ListButton>
                  </List>
                ) : online.error ? (
                  <Block className="text-center text-[15px] text-label-2">{online.error}</Block>
                ) : !online.results ? (
                  <Block className="text-center">
                    <Preloader />
                  </Block>
                ) : online.results.length ? (
                  <FoodList foods={online.results} onPick={pick} />
                ) : (
                  <Block className="text-center text-[15px] text-label-2">{t('food.noResults')}</Block>
                )}
              </>
            )}
          </>
        )}

        {view === 'scan' &&
          (scanned ? (
            <Block className="space-y-3 text-center text-[15px] text-label-2">
              <Preloader />
              <p>{t('food.lookingUp', { code: scanned })}</p>
            </Block>
          ) : (
            <BarcodeScanner onDetect={onBarcode} />
          ))}

        {view === 'create' && (
          <>
            {notice && <Block className="text-center text-[15px] text-label-2">{notice}</Block>}
            <FoodForm initialName={q} barcode={barcode} onSave={async (values) => pick(await createFood(values))} />
          </>
        )}

        {view === 'portion' && choice && (
          <PortionForm
            key={keyOf(choice)}
            food={choice}
            initialGrams={choice.servingGrams ?? 100}
            initialMeal={meal}
            submitLabel={t('food.add')}
            onSubmit={add}
          />
        )}
      </Page>
    </Popup>
  )
}

function FoodList({ foods, onPick }: { foods: Choice[]; onPick: (food: Choice) => void }) {
  const { t } = useTranslation()
  return (
    <List strong inset dividers>
      {foods.map((food) => (
        <ListItem
          key={keyOf(food)}
          link
          title={food.name}
          subtitle={[food.brand, food.source === 'usda' && 'USDA'].filter(Boolean).join(' · ') || undefined}
          after={
            <span className="tabular-nums">
              {Math.round(food.kcal)} <span className="text-[13px]">{t('food.kcalPer100')}</span>
            </span>
          }
          onClick={() => onPick(food)}
        />
      ))}
    </List>
  )
}
