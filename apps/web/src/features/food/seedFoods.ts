import type { UnitKind } from './types'

// Alimentos comunes precargados (lista pensada para Perú). Valores por 100 g y medidas caseras de USDA
// FoodData Central, SR Legacy (dominio público). Algunas medidas son derivadas de otra medida de USDA
// (1 taza = 16 cucharadas, 1 vaso = 8 fl oz). El comentario de cada fila es el alimento de USDA de
// origen (fdcId y descripción), para poder verificarlo.
// [id, nombre, name, kcal, proteína, carbohidratos, grasa, medidas, sinónimos para la búsqueda]
export type SeedFood = [string, string, string, number, number, number, number, [UnitKind, number][], string?]

export const SEED_FOODS: SeedFood[] = [
  ['huevo', 'Huevo de gallina', 'Egg', 143, 12.6, 0.7, 9.5, [['medium', 44], ['large', 50], ['small', 38]]], // 171287 Egg, whole, raw, fresh
  ['huevo-duro', 'Huevo duro (sancochado)', 'Hard-boiled egg', 155, 12.6, 1.1, 10.6, [['large', 50]], 'cocido'], // 173424 Egg, whole, cooked, hard-boiled
  ['huevo-frito', 'Huevo frito', 'Fried egg', 196, 13.6, 0.8, 14.8, [['large', 46]]], // 173423 Egg, whole, cooked, fried
  ['huevo-revuelto', 'Huevos revueltos', 'Scrambled eggs', 149, 10, 1.6, 11, [['cup', 220], ['tbsp', 13.7]]], // 172187 Egg, whole, cooked, scrambled
  ['pechuga-pollo-cruda', 'Pechuga de pollo cruda (sin piel)', 'Chicken breast, raw (skinless)', 120, 22.5, 0, 2.6, []], // 171077 Chicken, broiler or fryers, breast, skinless, boneless, meat only, raw
  ['pechuga-pollo', 'Pechuga de pollo cocida (plancha u horno)', 'Chicken breast, cooked', 165, 31, 0, 3.6, [['cup', 140]], 'filete'], // 171477 Chicken, broilers or fryers, breast, meat only, cooked, roasted
  ['muslo-pollo', 'Pierna de pollo al horno, sin piel (encuentro)', 'Chicken thigh, roasted, skinless', 179, 24.8, 0, 8.2, [['unit', 116]], 'muslo presa'], // 172388 Chicken, broilers or fryers, thigh, meat only, cooked, roasted
  ['pollo-con-piel', 'Pollo al horno o a la brasa, con piel', 'Roast chicken, with skin', 239, 27.3, 0, 13.6, [], 'brasa rostizado'], // 171450 Chicken, broilers or fryers, meat and skin, cooked, roasted
  ['higado-pollo', 'Hígado de pollo sancochado', 'Chicken liver, cooked', 167, 24.5, 0.9, 6.5, [['unit', 44]]], // 171061 Chicken, liver, all classes, cooked, simmered
  ['hot-dog-pollo', 'Hot dog de pollo', 'Chicken hot dog', 223, 15.5, 2.7, 16.2, [['unit', 45]], 'salchicha'], // 171624 Frankfurter, chicken
  ['carne-molida', 'Carne molida de res cruda (80/20)', 'Ground beef, raw (80/20)', 254, 17.2, 0, 20, []], // 174036 Beef, ground, 80% lean meat / 20% fat, raw
  ['carne-molida-magra', 'Carne molida especial cruda (90/10)', 'Lean ground beef, raw (90/10)', 176, 20, 0, 10, []], // 174030 Beef, ground, 90% lean meat / 10% fat, raw
  ['bistec-crudo', 'Bistec de res crudo (magro)', 'Beef steak, raw (lean)', 127, 22.3, 0, 3.5, [], 'carne res'], // 171804 Beef, top sirloin, steak, separable lean only, trimmed to 1/8" fat, select, raw
  ['bistec', 'Bistec de res a la plancha', 'Beef steak, grilled', 183, 30.6, 0, 5.8, [], 'carne res'], // 168634 Beef, top sirloin, steak, separable lean only, trimmed to 0" fat, all grades, cooked, broiled
  ['lomo-cerdo-crudo', 'Lomo de cerdo crudo', 'Pork tenderloin, raw', 109, 21, 0, 2.2, [], 'chancho'], // 168249 Pork, fresh, loin, tenderloin, separable lean only, raw
  ['lomo-cerdo', 'Lomo de cerdo al horno', 'Pork tenderloin, roasted', 143, 26.2, 0, 3.5, [], 'chancho'], // 168250 Pork, fresh, loin, tenderloin, separable lean only, cooked, roasted
  ['chuleta-cerdo', 'Chuleta de cerdo a la plancha', 'Pork chop, grilled', 180, 26.8, 0, 7.3, [['unit', 146]], 'chancho'], // 168240 Pork, fresh, loin, center loin (chops), bone-in, separable lean only, cooked, broiled
  ['jamon', 'Jamón en tajadas', 'Sliced ham', 107, 16.9, 0.7, 4, [['slice', 13]]], // 173863 Ham, sliced, pre-packaged, deli meat (96%fat free, water added)
  ['tocino', 'Tocino cocido', 'Bacon, cooked', 548, 35.7, 1.4, 43.3, [['slice', 8.1]], 'panceta'], // 167914 Pork, cured, bacon, cooked, baked
  ['atun-agua', 'Atún en agua (escurrido)', 'Canned tuna in water, drained', 86, 19.4, 0, 1, [['can', 165]]], // 173709 Fish, tuna, light, canned in water, drained solids (Includes foods for USDA's Food Distribution Program)
  ['atun-aceite', 'Atún en aceite (escurrido)', 'Canned tuna in oil, drained', 198, 29.1, 0, 8.2, [['can', 171]]], // 173708 Fish, tuna, light, canned in oil, drained solids
  ['jurel-lata', 'Jurel o caballa en conserva (escurrido)', 'Canned jack mackerel, drained', 156, 23.2, 0, 6.3, [], 'filete de caballa'], // 175121 Fish, mackerel, jack, canned, drained solids
  ['sardinas', 'Sardinas en aceite (escurridas)', 'Sardines in oil, drained', 208, 24.6, 0, 11.5, [['can', 92]]], // 175139 Fish, sardine, Atlantic, canned in oil, drained solids with bone
  ['trucha-cruda', 'Trucha cruda', 'Trout, raw', 141, 19.9, 0, 6.2, [['fillet', 79]]], // 173717 Fish, trout, rainbow, farmed, raw
  ['trucha', 'Trucha a la plancha', 'Trout, cooked', 168, 23.8, 0, 7.4, [['fillet', 71]]], // 173718 Fish, trout, rainbow, farmed, cooked, dry heat
  ['salmon', 'Salmón cocido', 'Salmon, cooked', 206, 22.1, 0, 12.4, []], // 175168 Fish, salmon, Atlantic, farmed, cooked, dry heat
  ['pescado-blanco', 'Pescado blanco cocido (merluza, bacalao)', 'White fish, cooked (cod)', 105, 22.8, 0, 0.9, [['fillet', 180]], 'filete'], // 171956 Fish, cod, Atlantic, cooked, dry heat
  ['langostinos', 'Langostinos o camarones cocidos', 'Shrimp, cooked', 119, 22.8, 1.5, 1.7, []], // 171971 Crustaceans, shrimp, mixed species, cooked, moist heat (may contain additives to retain moisture)
  ['calamar', 'Calamar crudo', 'Squid, raw', 92, 15.6, 3.1, 1.4, []], // 174223 Mollusks, squid, mixed species, raw
  ['choros', 'Choros (mejillones) cocidos', 'Mussels, cooked', 172, 23.8, 7.4, 4.5, []], // 174217 Mollusks, mussel, blue, cooked, moist heat
  ['leche-entera', 'Leche entera', 'Whole milk', 61, 3.2, 4.8, 3.3, [['glass', 244], ['cup', 244], ['tbsp', 15]]], // 171265 Milk, whole, 3.25% milkfat, with added vitamin D
  ['leche-semi', 'Leche semidescremada (2 %)', 'Reduced-fat milk (2%)', 50, 3.3, 4.8, 2, [['glass', 244], ['cup', 244]]], // 171267 Milk, reduced fat, fluid, 2% milkfat, with added vitamin A and vitamin D
  ['leche-descremada', 'Leche descremada', 'Skim milk', 34, 3.4, 5, 0.1, [['glass', 245], ['cup', 245]]], // 171269 Milk, nonfat, fluid, with added vitamin A and vitamin D (fat free or skim)
  ['leche-evaporada', 'Leche evaporada', 'Evaporated milk', 134, 6.8, 10, 7.6, [['tbsp', 15.8], ['cup', 252], ['can', 369]], 'tarro'], // 171276 Milk, canned, evaporated, with added vitamin D and without added vitamin A
  ['leche-chocolatada', 'Leche chocolatada', 'Chocolate milk', 83, 3.2, 10.3, 3.4, [['glass', 250]]], // 170879 Milk, chocolate, fluid, commercial, whole, with added vitamin A and vitamin D
  ['yogur-natural', 'Yogur natural entero', 'Plain whole-milk yogurt', 61, 3.5, 4.7, 3.3, [['cup', 245]], 'yogurt'], // 171284 Yogurt, plain, whole milk
  ['yogur-fruta', 'Yogur con fruta (bebible)', 'Fruit yogurt (drinkable)', 99, 4, 18.6, 1.2, [['glass', 245]], 'yogurt'], // 170889 Yogurt, fruit, low fat,9 g protein/8 oz
  ['yogur-griego', 'Yogur griego natural sin grasa', 'Greek yogurt, plain, nonfat', 59, 10.2, 3.6, 0.4, [], 'yogurt'], // 170894 Yogurt, Greek, plain, nonfat (Includes foods for USDA's Food Distribution Program)
  ['queso-fresco', 'Queso fresco', 'Queso fresco (fresh cheese)', 299, 18.1, 3, 23.8, [['cup', 122]]], // 172223 Cheese, fresh, queso fresco
  ['queso-mozzarella', 'Queso mozzarella', 'Mozzarella cheese', 299, 22.2, 2.4, 22.1, [['slice', 28.3], ['cup', 112]]], // 170845 Cheese, mozzarella, whole milk
  ['queso-parmesano', 'Queso parmesano rallado', 'Grated parmesan', 420, 28.4, 13.9, 27.8, [['tbsp', 5]]], // 171247 Cheese, parmesan, grated
  ['queso-cottage', 'Queso cottage', 'Cottage cheese', 81, 10.5, 4.8, 2.3, [['cup', 226]]], // 172182 Cheese, cottage, lowfat, 2% milkfat
  ['mantequilla', 'Mantequilla', 'Butter', 717, 0.9, 0.1, 81.1, [['tbsp', 14.2]]], // 173410 Butter, salted
  ['margarina', 'Margarina', 'Margarine', 717, 0.2, 0.7, 80.7, [['tbsp', 14], ['tsp', 4.7]]], // 172346 Margarine, regular, 80% fat, composite, stick, with salt
  ['crema-leche', 'Crema de leche', 'Heavy cream', 340, 2.8, 2.8, 36.1, [['tbsp', 15]]], // 170859 Cream, fluid, heavy whipping
  ['helado', 'Helado de vainilla', 'Vanilla ice cream', 207, 3.5, 23.6, 11, [['cup', 132]]], // 167575 Ice creams, vanilla
  ['proteina-whey', 'Proteína en polvo (whey)', 'Whey protein powder', 352, 78.1, 6.3, 1.6, [['serving', 32]], 'suplemento scoop'], // 173180 Beverages, Protein powder whey based
  ['arroz', 'Arroz blanco cocido', 'White rice, cooked', 130, 2.7, 28.2, 0.3, [['cup', 158]]], // 169753 Rice, white, long-grain, regular, cooked, enriched, with salt
  ['arroz-crudo', 'Arroz blanco crudo', 'White rice, raw', 365, 7.1, 80, 0.7, [['cup', 185]]], // 168877 Rice, white, long-grain, regular, raw, enriched
  ['fideos', 'Fideos cocidos (tallarines)', 'Pasta, cooked', 158, 5.8, 30.9, 0.9, [['cup', 124]], 'spaghetti pasta'], // 169737 Pasta, cooked, enriched, without added salt
  ['fideos-crudos', 'Fideos secos (crudos)', 'Pasta, dry', 371, 13, 74.7, 1.5, [], 'spaghetti pasta'], // 169736 Pasta, dry, enriched
  ['avena', 'Avena en hojuelas (cruda)', 'Rolled oats, dry', 379, 13.2, 67.7, 6.5, [['tbsp', 5.1], ['cup', 81]]], // 173904 Cereals, oats, regular and quick, not fortified, dry
  ['avena-cocida', 'Avena cocida con agua', 'Oatmeal, cooked with water', 71, 2.5, 12, 1.5, [['cup', 234], ['tbsp', 14.6]]], // 173905 Cereals, oats, regular and quick, unenriched, cooked with water (includes boiling and microwaving), without salt
  ['quinua', 'Quinua cocida', 'Quinoa, cooked', 120, 4.4, 21.3, 1.9, [['cup', 185]], 'quinoa'], // 168917 Quinoa, cooked
  ['quinua-cruda', 'Quinua cruda', 'Quinoa, uncooked', 368, 14.1, 64.2, 6.1, [['tbsp', 10.6], ['cup', 170]], 'quinoa'], // 168874 Quinoa, uncooked
  ['kiwicha', 'Kiwicha cruda', 'Amaranth, uncooked', 371, 13.6, 65.3, 7, [['tbsp', 12.1], ['cup', 193]], 'amaranto'], // 170682 Amaranth grain, uncooked
  ['pan-frances', 'Pan francés', 'French roll (pan francés)', 277, 8.6, 50.2, 4.3, [['unit', 38]], 'pan de piso'], // 172795 Rolls, french
  ['pan-molde', 'Pan de molde blanco', 'White sandwich bread', 266, 8.9, 49.4, 3.3, [['slice', 25]]], // 174924 Bread, white, commercially prepared (includes soft bread crumbs)
  ['pan-integral', 'Pan de molde integral', 'Whole wheat bread', 252, 12.5, 42.7, 3.5, [['slice', 32]]], // 172688 Bread, whole-wheat, commercially prepared
  ['harina', 'Harina de trigo', 'Wheat flour', 364, 10.3, 76.3, 1, [['tbsp', 7.8], ['cup', 125]]], // 168894 Wheat flour, white, all-purpose, enriched, bleached
  ['galletas-soda', 'Galletas de soda', 'Saltine crackers', 418, 9.5, 74.1, 8.6, [['unit', 6]]], // 172746 Crackers, saltines (includes oyster, soda, soup)
  ['corn-flakes', 'Hojuelas de maíz (corn flakes)', 'Corn flakes', 384, 5.9, 88, 0.9, [['cup', 28]], 'cereal'], // 174648 Cereals ready-to-eat, RALSTON Corn Flakes
  ['cancha', 'Cancha (maíz tostado)', 'Toasted corn (cancha)', 446, 8.5, 71.9, 15.6, [['cup', 85]], 'maiz'], // 167950 Snacks, KRAFT, CORNNUTS, plain
  ['canchita', 'Canchita (popcorn)', 'Popcorn', 387, 12.9, 77.8, 4.5, [['cup', 8]], 'palomitas pop corn'], // 167959 Snacks, popcorn, air-popped
  ['papa', 'Papa sancochada (sin cáscara)', 'Boiled potato (peeled)', 86, 1.7, 20, 0.1, [['medium', 167], ['small', 125], ['large', 300], ['cup', 156]], 'patata cocida'], // 170440 Potatoes, boiled, cooked without skin, flesh, without salt
  ['papas-fritas', 'Papas fritas', 'French fries', 168, 2.7, 28.7, 5.2, [], 'patatas'], // 170118 Potatoes, french fried, all types, salt not added in processing, frozen, oven-heated
  ['camote', 'Camote sancochado o al horno', 'Sweet potato, cooked', 90, 2, 20.7, 0.2, [['medium', 114], ['small', 60], ['large', 180], ['cup', 200]], 'batata boniato'], // 168483 Sweet potato, cooked, baked in skin, flesh, without salt
  ['yuca', 'Yuca cruda', 'Cassava, raw', 160, 1.4, 38.1, 0.3, [['cup', 206]], 'mandioca'], // 169985 Cassava, raw
  ['choclo', 'Choclo sancochado', 'Corn on the cob, boiled', 97, 3.3, 21.7, 1.4, [['medium', 103], ['large', 116], ['cup', 157]], 'elote maiz mazorca'], // 168539 Corn, sweet, white, cooked, boiled, drained, without salt
  ['maduro-frito', 'Plátano maduro frito', 'Fried ripe plantain', 236, 1.4, 40.8, 7.5, [['cup', 169]], 'platano de freir'], // 168200 Plantains, yellow, fried, Latino restaurant
  ['chifles', 'Plátano verde frito (chifles, patacones)', 'Fried green plantain', 309, 1.5, 49.2, 11.8, [['cup', 118]]], // 168199 Plantains, green, fried
  ['lentejas', 'Lentejas cocidas', 'Lentils, cooked', 116, 9, 20.1, 0.4, [['cup', 198], ['tbsp', 12.3]], 'menestra'], // 172421 Lentils, mature seeds, cooked, boiled, without salt
  ['frijol-canario', 'Frijol canario cocido', 'Canary beans, cooked', 144, 9.2, 25.3, 1.1, [['cup', 177]], 'menestra frejol'], // 173752 Beans, yellow, mature seeds, cooked, boiled, without salt
  ['frijol-negro', 'Frijol negro cocido', 'Black beans, cooked', 132, 8.9, 23.7, 0.5, [['cup', 172]], 'menestra frejol'], // 173735 Beans, black, mature seeds, cooked, boiled, without salt
  ['pallares', 'Pallares cocidos', 'Lima beans, cooked', 115, 7.8, 20.9, 0.4, [['cup', 188], ['tbsp', 11.7]], 'menestra frijol lima'], // 174253 Lima beans, large, mature seeds, cooked, boiled, without salt
  ['garbanzos', 'Garbanzos cocidos', 'Chickpeas, cooked', 164, 8.9, 27.4, 2.6, [['cup', 164]], 'menestra'], // 173757 Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt
  ['arvejas', 'Arvejas cocidas', 'Green peas, cooked', 78, 5.2, 14.3, 0.3, [['cup', 160]], 'guisantes'], // 170017 Peas, green, frozen, cooked, boiled, drained, without salt
  ['arveja-partida', 'Arveja partida cocida', 'Split peas, cooked', 118, 8.3, 21.1, 0.4, [['cup', 196]], 'menestra'], // 172429 Peas, split, mature seeds, cooked, boiled, without salt
  ['habas', 'Habas cocidas', 'Fava beans, cooked', 110, 7.6, 19.7, 0.4, [['cup', 170]], 'menestra'], // 173753 Broadbeans (fava beans), mature seeds, cooked, boiled, without salt
  ['platano', 'Plátano de seda (banana)', 'Banana', 89, 1.1, 22.8, 0.3, [['medium', 118], ['small', 101], ['large', 136]], 'guineo'], // 173944 Bananas, raw
  ['manzana', 'Manzana', 'Apple', 52, 0.3, 13.8, 0.2, [['medium', 182], ['small', 149], ['large', 223]]], // 171688 Apples, raw, with skin (Includes foods for USDA's Food Distribution Program)
  ['naranja', 'Naranja', 'Orange', 47, 0.9, 11.8, 0.1, [['unit', 131], ['small', 96], ['large', 184]]], // 169097 Oranges, raw, all commercial varieties
  ['mandarina', 'Mandarina', 'Tangerine', 53, 0.8, 13.3, 0.3, [['medium', 88], ['small', 76], ['large', 120]]], // 169105 Tangerines, (mandarin oranges), raw
  ['papaya', 'Papaya', 'Papaya', 43, 0.5, 10.8, 0.3, [['cup', 145]]], // 169926 Papayas, raw
  ['pina', 'Piña', 'Pineapple', 50, 0.5, 13.1, 0.1, [['slice', 84], ['cup', 165]]], // 169124 Pineapple, raw, all varieties
  ['mango', 'Mango', 'Mango', 60, 0.8, 15, 0.4, [['unit', 336], ['cup', 165]]], // 169910 Mangos, raw
  ['uvas', 'Uvas', 'Grapes', 69, 0.7, 18.1, 0.2, [['cup', 151]]], // 174683 Grapes, red or green (European type, such as Thompson seedless), raw
  ['fresas', 'Fresas', 'Strawberries', 32, 0.7, 7.7, 0.3, [['cup', 144], ['medium', 12]], 'frutillas'], // 167762 Strawberries, raw
  ['sandia', 'Sandía', 'Watermelon', 30, 0.6, 7.6, 0.2, [['slice', 286], ['cup', 152]]], // 167765 Watermelon, raw
  ['melon', 'Melón', 'Cantaloupe', 34, 0.8, 8.2, 0.2, [['cup', 160]]], // 169092 Melons, cantaloupe, raw
  ['palta', 'Palta', 'Avocado', 160, 2, 8.5, 14.7, [['unit', 201], ['cup', 150]], 'aguacate'], // 171705 Avocados, raw, all commercial varieties
  ['maracuya', 'Maracuyá (pulpa)', 'Passion fruit (pulp)', 97, 2.2, 23.4, 0.7, [['cup', 236]], 'parchita granadilla'], // 169108 Passion-fruit, (granadilla), purple, raw
  ['chirimoya', 'Chirimoya', 'Cherimoya', 75, 1.6, 17.7, 0.7, [['unit', 235], ['cup', 160]]], // 173953 Cherimoya, raw
  ['aguaymanto', 'Aguaymanto', 'Cape gooseberry', 53, 1.9, 11.2, 0.7, [['cup', 140]], 'uchuva physalis'], // 173043 Groundcherries, (cape-gooseberries or poha), raw
  ['limon', 'Jugo de limón', 'Lime juice', 25, 0.4, 8.4, 0.1, [['tbsp', 15.4]]], // 168156 Lime juice, raw
  ['pera', 'Pera', 'Pear', 63, 0.4, 15, 0.2, [['medium', 177], ['small', 152], ['large', 227]]], // 167776 Pears, raw, bartlett (Includes foods for USDA's Food Distribution Program)
  ['durazno', 'Durazno', 'Peach', 39, 0.9, 9.5, 0.3, [['medium', 150], ['small', 130], ['large', 175]], 'melocoton'], // 169928 Peaches, yellow, raw
  ['guayaba', 'Guayaba', 'Guava', 68, 2.6, 14.3, 1, [['unit', 55]]], // 173044 Guavas, common, raw
  ['tuna-fruta', 'Tuna (fruta)', 'Prickly pear', 41, 0.7, 9.6, 0.5, [['unit', 103]]], // 167750 Prickly pears, raw
  ['pasas', 'Pasas', 'Raisins', 299, 3.3, 79.3, 0.3, [['tbsp', 9.1], ['cup', 145]]], // 168165 Raisins, dark, seedless (Includes foods for USDA's Food Distribution Program)
  ['jugo-naranja', 'Jugo de naranja natural', 'Fresh orange juice', 45, 0.7, 10.4, 0.2, [['glass', 248]], 'zumo'], // 169098 Orange juice, raw (Includes foods for USDA's Food Distribution Program)
  ['tomate', 'Tomate', 'Tomato', 18, 0.9, 3.9, 0.2, [['medium', 123], ['large', 182], ['cup', 180]]], // 170457 Tomatoes, red, ripe, raw, year round average
  ['cebolla', 'Cebolla', 'Onion', 40, 1.1, 9.3, 0.1, [['medium', 110], ['small', 70], ['large', 150], ['tbsp', 10], ['cup', 160]]], // 170000 Onions, raw
  ['zanahoria', 'Zanahoria', 'Carrot', 41, 0.9, 9.6, 0.2, [['medium', 61], ['small', 50], ['large', 72], ['cup', 128]]], // 170393 Carrots, raw
  ['lechuga', 'Lechuga', 'Lettuce', 17, 1.2, 3.3, 0.3, [['cup', 47]]], // 169247 Lettuce, cos or romaine, raw
  ['pepino', 'Pepino', 'Cucumber', 15, 0.7, 3.6, 0.1, [['unit', 301], ['cup', 104]]], // 168409 Cucumber, with peel, raw
  ['brocoli', 'Brócoli sancochado', 'Broccoli, boiled', 35, 2.4, 7.2, 0.4, [['cup', 156]]], // 169967 Broccoli, cooked, boiled, drained, without salt
  ['espinaca', 'Espinaca cruda', 'Spinach, raw', 23, 2.9, 3.6, 0.4, [['cup', 30]]], // 168462 Spinach, raw
  ['zapallo', 'Zapallo crudo', 'Squash, raw', 34, 1, 8.6, 0.1, [['cup', 116]], 'calabaza auyama'], // 170489 Squash, winter, all varieties, raw
  ['vainitas', 'Vainitas sancochadas', 'Green beans, boiled', 35, 1.9, 7.9, 0.3, [['cup', 125]], 'ejotes judias verdes'], // 169141 Beans, snap, green, cooked, boiled, drained, without salt
  ['pimiento', 'Pimiento rojo', 'Red bell pepper', 26, 1, 6, 0.3, [['medium', 119], ['cup', 149]], 'morron'], // 170108 Peppers, sweet, red, raw
  ['aji', 'Ají fresco', 'Hot chili pepper', 40, 1.9, 8.8, 0.4, [['unit', 45]], 'rocoto chile'], // 170106 Peppers, hot chili, red, raw
  ['ajo', 'Ajo', 'Garlic', 149, 6.4, 33.1, 0.5, [['clove', 3], ['tsp', 2.8]]], // 169230 Garlic, raw
  ['beterraga', 'Beterraga sancochada', 'Beets, boiled', 44, 1.7, 10, 0.2, [['unit', 50], ['cup', 170]], 'remolacha betabel'], // 169146 Beets, cooked, boiled, drained
  ['coliflor', 'Coliflor', 'Cauliflower', 25, 1.9, 5, 0.3, [['cup', 107]]], // 169986 Cauliflower, raw
  ['apio', 'Apio', 'Celery', 14, 0.7, 3, 0.2, [['unit', 40], ['cup', 101]]], // 169988 Celery, raw
  ['col', 'Col (repollo)', 'Cabbage', 25, 1.3, 5.8, 0.1, [['cup', 70]]], // 169975 Cabbage, raw
  ['champinones', 'Champiñones', 'Mushrooms', 22, 3.1, 3.3, 0.3, [['cup', 70]], 'hongos'], // 169251 Mushrooms, white, raw
  ['zapallito', 'Zapallito italiano', 'Zucchini', 17, 1.2, 3.1, 0.3, [['medium', 196], ['cup', 124]], 'calabacin'], // 169291 Squash, summer, zucchini, includes skin, raw
  ['aceitunas', 'Aceitunas negras', 'Black olives', 116, 0.8, 6, 10.9, [['unit', 4.4], ['tbsp', 8.4]], 'botija'], // 169094 Olives, ripe, canned (small-extra large)
  ['aceite', 'Aceite vegetal', 'Vegetable oil', 884, 0, 0, 100, [['tbsp', 13.6], ['tsp', 4.5]]], // 171411 Oil, soybean, salad or cooking
  ['aceite-oliva', 'Aceite de oliva', 'Olive oil', 884, 0, 0, 100, [['tbsp', 13.5], ['tsp', 4.5]]], // 171413 Oil, olive, salad or cooking
  ['mayonesa', 'Mayonesa', 'Mayonnaise', 680, 1, 0.6, 74.9, [['tbsp', 13.8]]], // 171009 Salad dressing, mayonnaise, regular
  ['ketchup', 'Kétchup', 'Ketchup', 101, 1, 27.4, 0.1, [['tbsp', 17]], 'catsup'], // 168556 Catsup
  ['sillao', 'Sillao (salsa de soya)', 'Soy sauce', 53, 8.1, 4.9, 0.6, [['tbsp', 16], ['tsp', 5.3]]], // 174277 Soy sauce made from soy and wheat (shoyu)
  ['azucar', 'Azúcar', 'Sugar', 387, 0, 100, 0, [['tsp', 4.2], ['tbsp', 12.5]]], // 169655 Sugars, granulated
  ['miel', 'Miel de abeja', 'Honey', 304, 0.3, 82.4, 0, [['tbsp', 21], ['tsp', 7.1]]], // 169640 Honey
  ['mermelada', 'Mermelada', 'Jam', 278, 0.4, 68.9, 0.1, [['tbsp', 20]]], // 169641 Jams and preserves
  ['mantequilla-mani', 'Mantequilla de maní', 'Peanut butter', 598, 22.2, 22.3, 51.4, [['tbsp', 16]], 'crema de cacahuate'], // 172470 Peanut butter, smooth style, without salt
  ['mani', 'Maní tostado', 'Roasted peanuts', 587, 24.4, 21.3, 49.7, [['cup', 146]], 'cacahuate'], // 173806 Peanuts, all types, dry-roasted, without salt
  ['almendras', 'Almendras', 'Almonds', 579, 21.2, 21.6, 49.9, [['unit', 1.2], ['cup', 143]]], // 170567 Nuts, almonds
  ['nueces', 'Nueces', 'Walnuts', 654, 15.2, 13.7, 65.2, [['cup', 117]]], // 170187 Nuts, walnuts, english
  ['chia', 'Chía', 'Chia seeds', 486, 16.5, 42.1, 30.7, []], // 170554 Seeds, chia seeds, dried
  ['cacao', 'Cacao en polvo sin azúcar', 'Cocoa powder, unsweetened', 228, 19.6, 57.9, 13.7, [['tbsp', 5.4]]], // 169593 Cocoa, dry powder, unsweetened
  ['chocolate-bitter', 'Chocolate bitter 70 %', 'Dark chocolate 70%', 598, 7.8, 45.9, 42.6, []], // 170273 Chocolate, dark, 70-85% cacao solids
  ['chocolate-leche', 'Chocolate con leche', 'Milk chocolate', 535, 7.7, 59.4, 29.7, []], // 167587 Candies, milk chocolate
  ['galletas-chispas', 'Galletas con chispas de chocolate', 'Chocolate chip cookies', 492, 5.1, 65.4, 24.7, [['unit', 12.9]]], // 172716 Cookies, chocolate chip, commercially prepared, regular, higher fat, enriched
  ['papitas', 'Papitas fritas de bolsa', 'Potato chips', 532, 6.4, 53.8, 34, [['serving', 28]], 'chips'], // 169677 Snacks, potato chips, plain, salted
  ['gelatina', 'Gelatina preparada', 'Gelatin dessert', 60, 1.2, 14.2, 0, [['cup', 270]]], // 169596 Gelatin desserts, dry mix, prepared with water
  ['arroz-con-leche', 'Arroz con leche', 'Rice pudding', 146, 3.2, 24.9, 3.7, [['cup', 253]]], // 168063 Restaurant, Latino, arroz con leche (rice pudding)
  ['cafe', 'Café pasado sin azúcar', 'Brewed coffee', 1, 0.1, 0, 0, [['cup', 237]]], // 171890 Beverages, coffee, brewed, prepared with tap water
  ['te', 'Té o infusión sin azúcar', 'Tea, unsweetened', 1, 0, 0.3, 0, [['cup', 237]], 'mate manzanilla anis'], // 173227 Beverages, tea, black, brewed, prepared with tap water
  ['gaseosa', 'Gaseosa', 'Soda (cola)', 42, 0, 10.4, 0.3, [['glass', 245.6], ['can', 370]], 'cola refresco'], // 174852 Beverages, carbonated, cola, regular
  ['cerveza', 'Cerveza', 'Beer', 43, 0.5, 3.6, 0, [['glass', 237.6], ['can', 356]], 'chela'], // 168746 Alcoholic beverage, beer, regular, all
  ['vino', 'Vino tinto', 'Red wine', 85, 0.1, 2.6, 0, [['serving', 147]]], // 173190 Alcoholic beverage, wine, table, red
  ['arroz-con-pollo', 'Arroz con pollo', 'Chicken and rice', 174, 12, 20, 5.1, [['cup', 141]]], // 167659 Restaurant, Latino, chicken and rice, entree, prepared
  ['empanada', 'Empanada de carne', 'Beef empanada', 335, 11.3, 31.2, 18.4, [['unit', 89]]], // 167660 Restaurant, Latino, empanadas, beef, prepared
  ['tamal', 'Tamal', 'Tamale', 186, 3.5, 26.7, 7.2, [['unit', 166]]], // 167664 Restaurant, Latino, tamale, corn
]
