/** @odoo-module **/

import { Dialog } from "@web/core/dialog/dialog";
import { registry } from "@web/core/registry";
import { ListController } from "@web/views/list/list_controller";

class OpenModalListController extends ListController {
    setup() {
        super.setup();
    }

    async onOpenModal(ev) {
        ev.preventDefault();
        
        const dialog = new Dialog(this, {
            title: "Agregar registros",
            body: "<p>Contenido del modal aquí.</p>",  // Aquí puedes insertar el contenido HTML del modal.
            buttons: [
                {
                    text: "Guardar",
                    classes: "btn-primary",
                    click: () => this.saveModalData(),
                },
                {
                    text: "Cancelar",
                    close: true,
                },
            ],
        });
        dialog.open();
    }

    saveModalData() {
        // Aquí agregas la lógica para guardar la línea con la cualidad única
    }
}

registry.category("views").add("open_modal_list_controller", OpenModalListController);
