# -*- coding: utf-8 -*-
from odoo import models, fields, api


class productCategory(models.Model):
    _inherit = "product.category"

    is_plan = fields.Boolean()
    type_plan = fields.Selection(
        string="Tipo de Plan",
        selection=[
            ("anual", "Anual"),
            ("simple", "Simple"),
            ("multiviajes", "Multi-viaje"),
        ],
    )
    is_multi = fields.Boolean()


class crmLead(models.AbstractModel):

    _inherit = "crm.lead"

    # quote_selection_ids = fields.One2many(
    #     "crm.quote.selection", "lead_id", string="Cotizaciones Seleccionadas"
    # )

    def action_new_quotation(self):
        action = self.env["ir.actions.actions"]._for_xml_id(
            "sale_crm.sale_action_quotations_new"
        )
        action["context"] = self._prepare_opportunity_quotation_context()
        action["context"]["open_custom_wizard"] = True  # 👈 Bandera personalizada
        return action

    # def action_abrir_cotizacion(self):
    #     self.ensure_one()

    #     # Crea el wizard transitorio
    #     wizard = self.env["crm.quote"].create(
    #         {
    #             "lead_id": self.id,  # pasamos la oportunidad actual
    #         }
    #     )

    #     return {
    #         "name": "Cotización",
    #         "type": "ir.actions.act_window",
    #         "res_model": "crm.quote",
    #         "res_id": wizard.id,
    #         "view_mode": "form",
    #         "target": "new",  # 👈 Esto lo abre como modal
    #     }


# class CrmQuoteSelection(models.Model):
#     _name = "crm.quote.selection"
#     _description = "Selección de Cotización por Lead"

#     lead_id = fields.Many2one(
#         "crm.lead", string="Oportunidad", required=True, ondelete="cascade"
#     )
#     product_id = fields.Many2one(
#         "product.product", string="Producto Seleccionado", required=True
#     )
#     precio_final = fields.Float(string="Precio Final", required=True)
#     fecha_seleccion = fields.Datetime(
#         string="Fecha de Selección", default=fields.Datetime.now
#     )


class SaleOrder(models.AbstractModel):

    _inherit = "sale.order"

    def action_open_custom_quote_wizard(self):
        self.ensure_one()

        # Crea el wizard transitorio
        wizard = self.env["crm.quote"].create(
            {
                "order_id": self.id,  # pasamos la oportunidad actual
            }
        )

        return {
            "name": "Cotización",
            "type": "ir.actions.act_window",
            "res_model": "crm.quote",
            "res_id": wizard.id,
            "view_mode": "form",
            "target": "new",  # 👈 Esto lo abre como modal
        }
