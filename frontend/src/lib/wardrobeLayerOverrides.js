export const GARMENT_LAYERS=[
{key:'upper',label:'Upper clothing',fields:['top']},
{key:'lower',label:'Lower clothing',fields:['bottom','skirt_style']},
{key:'dress',label:'Dress',fields:['dress_style']},
{key:'underwear',label:'Underwear',fields:['underwear']},
{key:'hosiery',label:'Hosiery',fields:['hosiery_type']},
{key:'shoes',label:'Shoes',fields:['footwear','heel_type']},
{key:'accessories',label:'Accessories',fields:['glasses_style','accessories']},
];
export const layerVisible=(wardrobe,key)=>wardrobe?._layerVisibility?.[key]!==false;
export function setLayerVisible(wardrobe,key,visible){
 if(!GARMENT_LAYERS.some(layer=>layer.key===key))return wardrobe;
 const overrides={...(wardrobe._layerVisibility||{})};
 if(visible)delete overrides[key];else overrides[key]=false;
 return {...wardrobe,_layerVisibility:overrides};
}
