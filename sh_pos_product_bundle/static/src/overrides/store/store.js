/** @odoo-module */

import { patch } from "@web/core/utils/patch";
import { PosStore } from "@point_of_sale/app/store/pos_store";
import { ProductBundlePopup } from '@sh_pos_product_bundle/models/popups/ProductBundlePopup/ProductBundlePopup';
import { ProductQtyPopup } from '@sh_pos_product_bundle/models/popups/ProductQtyPopup/ProductQtyPopup';


patch(PosStore.prototype, {
  async _processData(loadedData) {
    
    await super._processData(...arguments);
    // Si se cargan datos de 'sh.product.bundle'
    if (loadedData['sh.product.bundle']) {
      // Inicializar las estructuras de datos para bundles
      this.db.bundles = [];
      this.db.bundle_by_product_id = {};
      // Añadir bundles a la base de datos
      this.db.add_bundles(loadedData['sh.product.bundle']);
    }
  },

  // Sobrescribir el método addProductFromUi para manejar la adición de productos desde la interfaz de usuario
  async addProductFromUi(product, options) {
    var self = this;

    // Si la configuración de bundle de productos está habilitada y el producto es un bundle
    if (this.config.enable_product_bundle && product && product.sh_is_bundle) {
        // Obtener el título y el ID del template del producto
        let title = product.display_name;
        var product_tmpl_id = product.product_tmpl_id;
        // Obtener el bundle correspondiente al ID del template del producto
        let bundle_by_product_id = this.db.bundle_by_product_id[product_tmpl_id];
        // Mostrar el popup de cantidad de productos y esperar confirmación
        const { confirmed, payload } = await this.popup.add(ProductQtyPopup, {
            title: title,
            price: product.lst_price,
            product: product,
            'bundle_by_product_id': bundle_by_product_id,
            // 'bundle_id': bundle_id,  // Añadir el ID del bundle al popup
        });
        
        // Si el popup es confirmado
        if (confirmed) {
          
            // Incrementar el contador de combos de la orden
            this.get_order().sh_combo_count += 1;
            let combo_count = this.get_order().sh_combo_count;

            // Obtener la lista de productos del combo
            let combo_list = Object.values(payload.combo_products);
            console.log(bundle_by_product_id,'__________________________________________________________________')
            // console.log(combo_list)
            for (let i = 0; i < combo_list.length; i++) {
                let each_option = combo_list[i];
                // Obtener el producto del combo por su ID
                let combo_product = await this.db.get_product_by_id(each_option.product_id);
                // Crear las opciones para el producto del combo
                let combo_option = {
                    'quantity': each_option.qty,
                    'price': each_option.price,  // Mantener el precio del producto del combo
                    merge: false,
                    extras: { sh_combo_count: combo_count },
                    'price_type': "manual",
                };
                console.log(payload.tax_check,combo_option)
                if (payload.tax_check){ 
                  // product_tax
                  combo_option['tax_ids'] = [13]

                }else{
                  combo_option['tax_ids'] = []
                }
                let orderline = await this.get_order().add_product(combo_product, combo_option);

                // Cambiar el tipo de precio a "manual" para la línea de orden recién añadida
                if (orderline) {
                  let combo_product_name = `${combo_product.display_name} - (${product.display_name})`;
                  orderline.full_product_name = combo_product_name;
                    orderline.price_type = "manual";
                    orderline.parent_product_id = product.id;
                    orderline.product_tmpl_id_bundle = product_tmpl_id;
                    orderline.productId_Original = each_option.productId_Original;
                    orderline.nameCombo = `${product.display_name}`;
                  
                }
            }
            
            return; 
        }
        return false;
    }

    // Llamar al método addProductFromUi original de la clase PosStore
    return super.addProductFromUi(...arguments);
  },

  // Método para mostrar el stock de un producto en un popup
  async showStock(id) {
    // Detener la propagación del evento
    event.stopPropagation();
    // Obtener el producto por su ID
    let product = this.db.get_product_by_id(id);

    // Obtener el ID del template del producto y el bundle correspondiente
    let product_tmpl_id = product.product_tmpl_id;
    let bundle_by_product_id = this.db.bundle_by_product_id[product_tmpl_id];

    // Mostrar el popup de bundle de productos
    await this.popup.add(ProductBundlePopup, {
        title: "Bundle !",
        'bundle_by_product_id': bundle_by_product_id,
    });
  },
  
});
