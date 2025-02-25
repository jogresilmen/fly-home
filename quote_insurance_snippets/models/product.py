from odoo import models, fields, api


class ProductCode(models.Model):
    _inherit = 'product.template'

 
    codigo = fields.Char(
        string='codigo',
    )

    
    def _compute_prices_from_coverages(self):
        for product in self:
            coberturas = self.env['product.plan.cobertura'].search([('product_ids','=',product.id),('operation_type','=','asset')])
            total_cost = sum(cobertura.cost for cobertura in coberturas)
            total_price = sum(cobertura.prist_list for cobertura in coberturas)
            product.standard_price = total_cost
            product.list_price = total_price

    @api.model
    def update_product_prices(self):
        products = self.search([])
        for product in products:
            product._compute_prices_from_coverages()

    