/** @odoo-module */

import { PosDB } from "@point_of_sale/app/store/db";
import { patch } from "@web/core/utils/patch";

patch(PosDB.prototype, {
    add_bundles: function (bundles) {
        if (!bundles instanceof Array) {
            bundles = [bundles];
        }
        for (var i = 0, len = bundles.length; i < len; i++) {
            var bundle = bundles[i];
            this.bundles.push(bundle);

            if (bundle.sh_bundle_id in this.bundle_by_product_id) {
                var tmp_data_list = this.bundle_by_product_id[bundle.sh_bundle_id];
                var data_list = [bundle.sh_product_id, bundle.sh_qty, bundle.sh_uom, bundle.sh_price_unit];
                tmp_data_list.push(data_list);
                this.bundle_by_product_id[bundle.sh_bundle_id] = tmp_data_list;
            } else {
                var data_list = [bundle.sh_product_id, bundle.sh_qty, bundle.sh_uom, bundle.sh_price_unit];
                this.bundle_by_product_id[bundle.sh_bundle_id] = [data_list];
            }
        }
    },
})