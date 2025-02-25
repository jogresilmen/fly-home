/** @odoo-module */
import { useService } from "@web/core/utils/hooks";
import { KanbanDropdownMenuWrapper } from "@web/views/kanban/kanban_dropdown_menu_wrapper";
import { patch } from "@web/core/utils/patch";
import { Component, useState } from "@odoo/owl";
import { Dialog } from "@web/core/dialog/dialog";

class VPOSActionWizard extends Component {
    setup() {
        this.state = useState({
            isLoading: false,
            result: null,
            error: null,
        });
        this.notification = useService("notification");
    }

    async executeAction() {
        this.state.isLoading = true;
        this.state.result = null;
        this.state.error = null;

        try {
            const result = await this.props.execute();
            this.state.result = result;
            this.notification.add(`VPOS action '${this.props.action}' executed successfully`, {
                type: "success",
            });
        } catch (error) {
            this.state.error = error.message || "An error occurred";
            this.notification.add(`Error in VPOS action '${this.props.action}': ${this.state.error}`, {
                type: "danger",
            });
        } finally {
            this.state.isLoading = false;
        }
    }
}
VPOSActionWizard.template = 'l10n_ve_vpos.VPOSActionWizard';
VPOSActionWizard.components = { Dialog };

patch(KanbanDropdownMenuWrapper, {
    setup() {
        this._super(...arguments);
        this.orm = useService("orm");
        this.dialog = useService("dialog");
        console.log("KanbanDropdownMenuWrapper patched setup completed");
    },

    onClick(ev) {
        console.log("onClick triggered", ev);
        const vposAction = ev.target.closest('[vpos_action]');
        if (vposAction) {
            const action = vposAction.getAttribute('vpos_action');
            console.log("VPOS action:", action);
            
            if (this.props.record.data.vpos) {
                console.log("VPOS action condition met");
                ev.preventDefault();
                ev.stopPropagation();
                this.showVPOSActionWizard(action);
            } else {
                console.log("VPOS not available for this record");
                this.notification.add("VPOS not available for this record", {
                    type: "warning",
                });
            }
        } else {
            console.log("Calling super.onClick");
            this._super(...arguments);
        }
    },

    showVPOSActionWizard(action) {
        this.dialog.add(VPOSActionWizard, {
            title: `Execute VPOS Action: ${action}`,
            action: action,
            execute: () => this._vpos_execute(action),
        });
    },

    async _vpos_execute(action) {
        console.log("_vpos_execute called with action:", action);
        const url = this.props.record.data.vpos_restApi;
        console.log("VPOS REST API URL:", url);

        if (!url) {
            throw new Error("VPOS REST API URL is not defined");
        }

        const params = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ accion: action }),
        };

        const response = await fetch(`${url}/vpos/metodo`, params);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rs = await response.json();
        console.log("VPOS response:", rs);

        if (!["00", "100"].includes(rs.codRespuesta)) {
            throw new Error(rs.mensajeRespuesta);
        }

        return rs;
    },
});