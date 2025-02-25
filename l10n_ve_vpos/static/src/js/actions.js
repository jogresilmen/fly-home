/** @odoo-module **/

import { useService } from "@web/core/utils/hooks";
import { registry } from "@web/core/registry";
import { Component, useState, xml } from "@odoo/owl";

class PosConfigKanbanOptions extends Component {
    static template = "pos_vpos.PosConfigKanbanOptions";
    static props = {};

    setup() {
        super.setup();
        this.state = useState({
            // Add any state properties you need
        });
        console.log("setup ***");
    }

    showOpcion1(ev) {
        // Lógica para Opción 1
        console.log("Opción 1 seleccionada");
    }

    showOpcion2(ev) {
        // Lógica para Opción 2
        console.log("Opción 2 seleccionada");
    }
}

PosConfigKanbanOptions.template = xml`
    <div>
        <a href="#" t-on-click.prevent="showOpcion1">Opción 1</a>
        <a href="#" t-on-click.prevent="showOpcion2">Opción 2</a>
    </div>
`;

registry.category("components").add("pos_vpos.PosConfigKanbanOptions", PosConfigKanbanOptions);

export default PosConfigKanbanOptions;