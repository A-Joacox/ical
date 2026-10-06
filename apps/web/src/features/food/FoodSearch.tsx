import type { ReactNode } from 'react'
import { Block, BlockTitle, Button, List, ListButton, ListItem, Preloader } from 'konsta/react'
import { Camera, PencilLine, Plus, ScanBarcode } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { FoodResult } from './api'
import { measuresOf } from './data'
import { useFoodName } from './hooks'
import type { Food } from './types'

// Un alimento ya guardado en el iPhone o un resultado del server (se guarda al usarlo).
export type Choice = Food | FoodResult
export type Online = { query: string; results?: FoodResult[]; error?: string }

export const keyOf = (food: Choice) => ('id' in food ? food.id : `${food.source}:${food.sourceId}`)

type Props = {
  query: string
  /** Eligiendo un ingrediente para un plato: sin platos ni "Nuevo plato". */
  picking: boolean
  recipes: Food[]
  recents: Food[]
  local: Choice[]
  online: Online | null
  notice: string | null
  onPick: (food: Choice) => void
  onSearchOnline: () => void
  onPhoto: () => void
  onScan: () => void
  onCreateFood: () => void
  onNewRecipe: () => void
}

// Contenido de la búsqueda: sin texto, mis platos y recientes; con texto, lo guardado y lo de internet.
export function FoodSearch(props: Props) {
  const { query, picking, recipes, recents, local, online, notice, onPick } = props
  const { t } = useTranslation()
  const q = query.trim()

  return (
    <>
      {/* La foto registra lo que se comió; no sirve para elegir un ingrediente. */}
      <Block className={`grid gap-2 ${picking ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {!picking && (
          <Button large rounded tonal className="px-2" onClick={props.onPhoto}>
            <Camera className="mr-1 h-5 w-5 shrink-0" />
            {t('food.photo')}
          </Button>
        )}
        <Button large rounded tonal className="px-2" onClick={props.onScan}>
          <ScanBarcode className="mr-1 h-5 w-5 shrink-0" />
          {t('food.scan')}
        </Button>
        <Button large rounded tonal className="px-2" onClick={props.onCreateFood}>
          <PencilLine className="mr-1 h-5 w-5 shrink-0" />
          {t('food.create')}
        </Button>
      </Block>
      {notice && <Block className="text-center text-[15px] text-label-2">{notice}</Block>}

      {!q ? (
        <>
          {!picking && (
            <>
              <BlockTitle>{t('food.myDishes')}</BlockTitle>
              <FoodList foods={recipes} onPick={onPick}>
                <ListButton onClick={props.onNewRecipe}>
                  <Plus className="mr-1 h-5 w-5" />
                  {t('food.newDish')}
                </ListButton>
              </FoodList>
            </>
          )}
          {recents.length ? (
            <>
              <BlockTitle>{t('food.recents')}</BlockTitle>
              <FoodList foods={recents} onPick={onPick} />
            </>
          ) : (
            <Block className="text-center text-[15px] text-label-2">{t('food.emptyHint')}</Block>
          )}
        </>
      ) : (
        <>
          {local.length > 0 && (
            <>
              <BlockTitle>{t('food.myFoods')}</BlockTitle>
              <FoodList foods={local} onPick={onPick} />
            </>
          )}
          <BlockTitle>{t('food.online')}</BlockTitle>
          {online?.query !== q ? (
            <List strong inset>
              <ListButton onClick={props.onSearchOnline}>{t('food.searchOnline', { query: q })}</ListButton>
            </List>
          ) : online.error ? (
            <Block className="text-center text-[15px] text-label-2">{online.error}</Block>
          ) : !online.results ? (
            <Block className="text-center">
              <Preloader />
            </Block>
          ) : online.results.length ? (
            <FoodList foods={online.results} onPick={onPick} />
          ) : (
            <Block className="text-center text-[15px] text-label-2">{t('food.noResults')}</Block>
          )}
        </>
      )}
    </>
  )
}

function FoodList({ foods, onPick, children }: { foods: Choice[]; onPick: (food: Choice) => void; children?: ReactNode }) {
  const { t } = useTranslation()
  const foodName = useFoodName()
  // Ingredientes de un plato, marca y origen o, si no hay, su primera medida casera.
  const subtitle = (food: Choice) => {
    if ('ingredients' in food && food.ingredients) return t('food.ingredientsCount', { count: food.ingredients.length })
    const origin = [food.brand, food.source === 'usda' && 'USDA'].filter(Boolean).join(' · ')
    const [measure] = measuresOf(food)
    return origin || (measure && `1 ${t(`food.units.${measure.kind}`, { count: 1 })} = ${measure.grams} g`) || undefined
  }

  return (
    <List strong inset dividers>
      {foods.map((food) => (
        <ListItem
          key={keyOf(food)}
          link
          title={foodName(food)}
          subtitle={subtitle(food)}
          after={
            <span className="tabular-nums">
              {Math.round(food.kcal)} <span className="text-[13px]">{t('food.kcalPer100')}</span>
            </span>
          }
          onClick={() => onPick(food)}
        />
      ))}
      {children}
    </List>
  )
}
