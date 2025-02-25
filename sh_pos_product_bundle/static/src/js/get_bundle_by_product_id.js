/** @odoo-module */
import { patch } from "@web/core/utils/patch";
import { PosDB } from "@point_of_sale/app/store/db";

patch(PosDB.prototype, {
    get_bundles_by_product_id: function (product_id) {
        const matching_bundles = [];

        for (const bundle of this.bundles) {
            if (parseInt(bundle.sh_bundle_id) === parseInt(product_id)) {
                matching_bundles.push(bundle);
            }
        }

        return matching_bundles.length > 0 ? matching_bundles : false;
    },
});

patch(PosDB.prototype, {
    /**
     * Obtiene todos los productos asociados a un product_tmpl_id.
     * @param {number} template_id - El ID del template de producto.
     * @returns {array} - Array de productos que pertenecen al template.
     */
    get_products_by_template_id: function (template_id) {
        return this.products.filter(product => product.product_tmpl_id === template_id);
    },
});
