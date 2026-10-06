import { useState } from 'react'
import { Block, Link, NavbarBackLink, Page, Popup, Preloader, Searchbar } from 'konsta/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { Navbar } from '../../ui/Navbar'
import { lookupBarcode, searchFoods } from './api'
import { BarcodeScanner } from './BarcodeScanner'
import {
  addEntry,
  createFood,
  deleteFood,
  findFoodByBarcode,
  getIngredients,
  getRecentFoods,
  getRecipes,
  saveFoodResult,
  saveRecipe,
  searchLocalFoods,
  updateFood,
  type FoodValues,
} from './data'
import { FoodForm } from './FoodForm'
import { FoodSearch, keyOf, type Choice, type Online } from './FoodSearch'
import { PortionForm } from './PortionForm'
import { parseGrams, RecipeForm, type RecipeDraft } from './RecipeForm'
import type { Food, Meal } from './types'

// 'food': crear o corregir un alimento. 'recipe': crear o corregir un plato.
type View = 'search' | 'scan' | 'food' | 'portion' | 'recipe'

const notRecipe = (food: Food) => food.source !== 'recipe'

type Props = { opened: boolean; meal: Meal; date: string; onClose: () => void }

// Añadir a una comida: mis platos, recientes, búsqueda, código de barras o alimento propio.
// También se usa para armar un plato: mientras `picking`, lo elegido va como ingrediente.
export function AddFoodPopup({ opened, meal, date, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'es'
  const [view, setView] = useState<View>('search')
  const [query, setQuery] = useState('')
  const [online, setOnline] = useState<Online | null>(null)
  const [choice, setChoice] = useState<Choice | null>(null)
  const [foodForm, setFoodForm] = useState<{ initial: Partial<FoodValues>; editing?: Food }>({ initial: {} })
  const [draft, setDraft] = useState<RecipeDraft | null>(null)
  const [picking, setPicking] = useState(false)
  const [scanned, setScanned] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null)
  const q = query.trim()
  const recipes = useLiveQuery(() => (opened ? getRecipes() : []), [opened])
  const recents = useLiveQuery(async () => (opened ? (await getRecentFoods()).filter(notRecipe) : []), [opened])
  const local = useLiveQuery(async () => (q ? (await searchLocalFoods(q)).filter((f) => !picking || notRecipe(f)) : []), [q, picking])

  const show = (next: View) => {
    setNotice(null)
    setScanned(null)
    setView(next)
  }
  const resetSearch = () => {
    setQuery('')
    setOnline(null)
  }
  const close = () => {
    resetSearch()
    setChoice(null)
    setDraft(null)
    setPicking(false)
    show('search')
    onClose()
  }

  const pick = async (food: Choice) => {
    if (!picking) {
      setChoice(food)
      return show('portion')
    }
    const saved = 'id' in food ? food : await saveFoodResult(food)
    setDraft((d) => d && { ...d, items: [...d.items, { food: saved, grams: String(saved.servingGrams ?? 100) }] })
    setPicking(false)
    resetSearch()
    show('recipe')
  }

  const back = () => {
    if (view === 'search') {
      // Solo hay "atrás" en la búsqueda mientras se elige un ingrediente.
      setPicking(false)
      resetSearch()
      return show('recipe')
    }
    if (view === 'recipe') {
      const editing = !!draft?.id
      setDraft(null)
      return show(editing ? 'portion' : 'search')
    }
    show(view === 'food' && foodForm.editing ? 'portion' : 'search')
  }

  const errorText = (error: unknown) =>
    error instanceof ApiError ? t(error.status === 401 ? 'food.needSession' : 'food.apiUnavailable') : t('food.offline')

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
      await pick(await lookupBarcode(code, lang))
    } catch (error) {
      const notFound = error instanceof ApiError && error.status === 404
      setFoodForm({ initial: { name: q, barcode: code } })
      show(notFound ? 'food' : 'search')
      setNotice(notFound ? t('food.barcodeNotFound') : errorText(error))
    }
  }

  const saveFood = async (values: FoodValues) => {
    if (!foodForm.editing) return pick(await createFood(values))
    setChoice(await updateFood(foodForm.editing.id, values))
    show('portion')
  }

  const edit = async (food: Food) => {
    if (food.source !== 'recipe') {
      setFoodForm({ initial: food, editing: food })
      return show('food')
    }
    const items = (await getIngredients(food)).map((item) => ({ food: item.food, grams: String(item.grams) }))
    setDraft({ id: food.id, name: food.name, items, cookedGrams: food.cookedGrams ? String(food.cookedGrams) : '' })
    show('recipe')
  }

  const saveDraft = async () => {
    if (!draft) return
    const items = draft.items.map((item) => ({ food: item.food, grams: parseGrams(item.grams)! }))
    setChoice(await saveRecipe({ id: draft.id, name: draft.name.trim(), items, cookedGrams: parseGrams(draft.cookedGrams) }))
    setDraft(null)
    show('portion')
  }

  const add = async (grams: number, chosenMeal: Meal) => {
    if (!choice) return
    const food = 'id' in choice ? choice : await saveFoodResult(choice)
    await addEntry(food, grams, chosenMeal, date)
    close()
  }

  const titles = {
    search: picking ? t('food.addIngredient') : t('food.addTo', { meal: t(`food.meals.${meal}`) }),
    scan: t('food.scanTitle'),
    food: foodForm.editing ? t('food.editFood') : t('food.newFood'),
    portion: t('food.portion'),
    recipe: draft?.id ? t('food.editDish') : t('food.newDish'),
  }

  return (
    <Popup opened={opened} onBackdropClick={close}>
      <Page>
        <Navbar
          title={titles[view]}
          left={(view !== 'search' || picking) && <NavbarBackLink text={t('food.back')} onClick={back} />}
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
          <FoodSearch
            query={query}
            picking={picking}
            recipes={recipes ?? []}
            recents={recents ?? []}
            local={local ?? []}
            online={online}
            notice={notice}
            onPick={pick}
            onSearchOnline={searchOnline}
            onScan={() => show('scan')}
            onCreateFood={() => {
              setFoodForm({ initial: { name: q } })
              show('food')
            }}
            onNewRecipe={() => {
              setDraft({ name: '', items: [], cookedGrams: '' })
              show('recipe')
            }}
          />
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

        {view === 'food' && (
          <>
            {notice && <Block className="text-center text-[15px] text-label-2">{notice}</Block>}
            <FoodForm
              key={foodForm.editing?.id ?? 'new'}
              initial={foodForm.initial}
              submitLabel={foodForm.editing ? t('food.save') : t('food.saveAndContinue')}
              onSave={saveFood}
              onDelete={foodForm.editing && (() => setDeleting(foodForm.editing!))}
            />
          </>
        )}

        {view === 'recipe' && draft && (
          <RecipeForm
            draft={draft}
            onChange={setDraft}
            onAddIngredient={() => {
              setPicking(true)
              resetSearch()
              show('search')
            }}
            onSave={saveDraft}
            onDelete={draft.id ? () => setDeleting({ id: draft.id!, name: draft.name }) : undefined}
          />
        )}

        {view === 'portion' && choice && (
          <PortionForm
            key={`${keyOf(choice)}-${'updatedAt' in choice ? choice.updatedAt : ''}`}
            food={choice}
            initialGrams={choice.servingGrams ?? 100}
            initialMeal={meal}
            submitLabel={t('food.add')}
            onSubmit={add}
            onEdit={'id' in choice ? () => edit(choice) : undefined}
          />
        )}

        <ConfirmDialog
          opened={deleting !== null}
          title={t('food.deleteTitle')}
          text={deleting?.name ?? ''}
          confirmLabel={t('food.delete')}
          destructive
          onConfirm={async () => {
            await deleteFood(deleting!.id)
            setDraft(null)
            setChoice(null)
            show('search')
          }}
          onClose={() => setDeleting(null)}
        />
      </Page>
    </Popup>
  )
}
