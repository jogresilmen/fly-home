/** @odoo-module **/

import { Navbar } from "@point_of_sale/app/navbar/navbar";
import { patch } from "@web/core/utils/patch";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { _t } from "@web/core/l10n/translation";

patch(Navbar.prototype, {

    sendRequest(action, data = {}) {
        const vpos_restApi = 'http://localhost:3333';
        const params = {
            async: true,
            crossDomain: true,
            method: "POST",
            headers: {
                "content-type": "application/json",
                'Access-Control-Allow-Origin': '*',
            },
            processData: false,
            url: `${vpos_restApi}/vpos/metodo/${action}`,
            data: JSON.stringify(data),
        };

        return new Promise((resolve, reject) => {

            $.ajax(params)
                .done((response) => {
                    if (["00", "100"].indexOf(response.codRespuesta) > -1) {
                        console.log(`*** Response for ${action} ***`);
                        console.log(response);
                        console.log(`*** End of Response ***`);
                        resolve(response);
                    } else {
                        this.showError(response.mensajeRespuesta);
                        reject(response);
                    }
                })
                .fail((error) => {
                    this.showError(_t("Cannot connect with vpos"));
                    reject(error);
                });
        });
    },

    showError(message, title) {
        this.env.services.popup.add(ErrorPopup, {
            title: title || _t("Payment Terminal Error"),
            body: message,
        });
    },


    async transaccion_aprobada() {
        const action = "imprimeUltimoVoucher"; // Nombre de la acción para la petición
        const data = { /* Datos específicos para esta acción */ };

        try {
            const response = await this.sendRequest(action, data);
            // Manejar la respuesta aquí
            console.log("Transacción aprobada:", response);
        } catch (error) {
            console.error("Error en transacción aprobada:", error);
        }
    },

    async transaccion_procesada() {
        const action = "imprimeUltimoVoucherP";
        const data = { /* Datos específicos para esta acción */ };

        try {
            const response = await this.sendRequest(action, data);
            console.log("Transacción procesada:", response);
        } catch (error) {
            console.error("Error en transacción procesada:", error);
        }
    },

    async Pre_cierre() {
        const action = "precierre";
        const data = { /* Datos específicos para esta acción */ };
        try {
            const response = await this.sendRequest(action, data);
        } catch (error) {
            console.error("Error en Pre cierre:", error);
        }
    },

    async Cierre_pos() {
        const action = " cierre";
        const data = { /* Datos específicos para esta acción */ };

        try {
            console.log("{Socializar}");
            const response = await this.sendRequest(action, data);
            console.log("Cierre POS:", response);
        } catch (error) {
            console.error("Error en Cierre POS:", error);
        }
    },

    async ultimo_cierre() {
        const action = "ultimoCierre";
        const data = { /* Datos específicos para esta acción */ };

        try {
            const response = await this.sendRequest(action, data);
            console.log("Último cierre:", response);
        } catch (error) {
            console.error("Error en último cierre:", error);
        }
    },
});
