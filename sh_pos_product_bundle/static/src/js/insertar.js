/** @odoo-module */

import { patch } from "@web/core/utils/patch";
import { Orderline } from "@point_of_sale/app/store/models";

patch(Orderline.prototype, {
    setup() {
        super.setup(...arguments);
        this.parent_product_id = this.parent_product_id || null;
        this.product_tmpl_id_bundle = this.product_tmpl_id_bundle || null;
        this.productId_Original = this.productId_Original || null;
        this.nameCombo = this.nameCombo || null; // Asegura que nameCombo tenga un valor por defecto
    },

    getParentProductId() {
        return this.parent_product_id;
    },

    setParentProductId(parentProductId) {
        this.parent_product_id = parentProductId;
    },

    getProductTemplateIdBundle() {
        return this.product_tmpl_id_bundle;
    },
    
    setProductTemplateIdBundle(productTemplateId) {
        this.product_tmpl_id_bundle = productTemplateId;
    },

    getProductIdOriginal() {
        return this.productId_Original;
    },

    setProductIdOriginal(productIdOriginal) {
        this.productId_Original = productIdOriginal;
    },

    getNameCombo() {
        return this.nameCombo;
    },

    setNameCombo(nameCombo) {
        this.nameCombo = nameCombo;
    },

    export_as_JSON() {
        const json = super.export_as_JSON(...arguments);
        json.parent_product_id = this.getParentProductId();
        json.product_tmpl_id_bundle = this.getProductTemplateIdBundle();
        json.productId_Original = this.getProductIdOriginal();
        json.nameCombo = this.getNameCombo(); // Incluye nameCombo en la exportación JSON
        json.id = this.id;  // Asegura que el ID esté incluido
        return json;
    },

    init_from_JSON(json) {
        super.init_from_JSON(...arguments);
        this.setParentProductId(json.parent_product_id);
        this.setProductTemplateIdBundle(json.product_tmpl_id_bundle);
        this.setProductIdOriginal(json.productId_Original);
        this.setNameCombo(json.nameCombo); // Restaura nameCombo desde JSON
        this.id = json.id;  // Restaura el ID desde JSON
    },

    export_for_printing() {
        const json = super.export_for_printing(...arguments);
        json.parent_product_id = this.getParentProductId();
        json.product_tmpl_id_bundle = this.getProductTemplateIdBundle();
        json.productId_Original = this.getProductIdOriginal();
        json.nameCombo = this.getNameCombo(); // Incluye nameCombo en la exportación para impresión
        json.id = this.id;  // Asegura que el ID esté incluido
        return json;
    },

    can_be_merged_with(orderline) {
        if (this.getParentProductId() !== orderline.getParentProductId() ||
            this.getProductTemplateIdBundle() !== orderline.getProductTemplateIdBundle() ||
            this.getProductIdOriginal() !== orderline.getProductIdOriginal() ||
            this.getNameCombo() !== orderline.getNameCombo()) { // Comparar también nameCombo
            return false;
        }
        return super.can_be_merged_with(...arguments);
    },

    getDisplayData() {
        return {
            ...super.getDisplayData(),
            parent_product_id: this.getParentProductId(),
            product_tmpl_id_bundle: this.getProductTemplateIdBundle(),
            productId_Original: this.getProductIdOriginal(),
            nameCombo: this.getNameCombo(), // Incluye nameCombo en los datos de visualización
            id: this.id,  // Asegura que el ID esté incluido
        };
    },
});
