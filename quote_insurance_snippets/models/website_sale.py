from odoo import models, _
from odoo.tools.translate import _lt


class WebsiteSaleCustom(models.Model):
    _inherit = "website"

    def _get_checkout_step_list(self):
        steps = super()._get_checkout_step_list()

        for step in steps:
            xmlids, step_data = step
            step_data["back_button_href"] = "/"
            step_data["back_button"] = "Start a new quote"

        return steps

    def sale_get_order(self, force_create=False, update_pricelist=False):
        # Forzar update_pricelist a False siempre
        return super(WebsiteSaleCustom, self).sale_get_order(
            force_create=force_create, update_pricelist=False
        )
