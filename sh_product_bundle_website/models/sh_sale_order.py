# -*- coding: utf-8 -*-
# Part of Softhealer Technologies.

from odoo import api, fields, models, _


class ShSaleOrder(models.Model):
    _inherit = 'sale.order.line'

    is_bundle_item = fields.Boolean("¿Es un artículo de paquete?")
    sh_bundle_initial_qty = fields.Float("Cantidad Inicial del Paquete")

    @api.depends('product_id', 'product_uom', 'product_uom_qty')
    def _compute_price_unit(self):
        """
        prevent to count unit price for sub bundle products
        """
        for line in self:
            if not line.is_bundle_item:
                if line.qty_invoiced > 0:
                    continue
                if not line.product_uom or not line.product_id:
                    line.price_unit = 0.0
                else:
                    price = line.with_company(line.company_id)._get_display_price()
                    line.price_unit = line.product_id._get_tax_included_unit_price(
                        line.company_id or line.env.company,
                        line.order_id.currency_id,
                        line.order_id.date_order,
                        'sale',
                        fiscal_position=line.order_id.fiscal_position_id,
                        product_price_unit=price,
                        product_currency=line.currency_id
                    )
            else:
                line.price_unit = line.price_unit


    @api.depends('product_uom_qty', 'discount', 'price_unit', 'tax_id')
    def _compute_amount(self):
        """
        Compute the amounts of the SO line. prevent to count subtotal for sub bundle products
        """
        for line in self:
            tax_results = self.env['account.tax']._compute_taxes([
                line._convert_to_tax_base_line_dict()
            ])
            totals = list(tax_results['totals'].values())[0]
            amount_untaxed = totals['amount_untaxed']
            amount_tax = totals['amount_tax']

            line.update({
                'price_subtotal': amount_untaxed,
                'price_tax': amount_tax,
                'price_total': amount_untaxed + amount_tax,
            })


class SaleOrder(models.Model):
    _inherit = "sale.order"

    def _cart_update(self, product_id=None, line_id=None, add_qty=0, set_qty=0, **kwargs):
        
        self.ensure_one()
        res = super(SaleOrder, self)._cart_update(
            product_id, line_id, add_qty, set_qty)

        product_context = dict(self.env.context)
        product_context.setdefault('lang', self.sudo().partner_id.lang)
        SaleOrderLineSudo = self.env['sale.order.line'].sudo(
        ).with_context(product_context)
        product_with_context = self.env['product.product'].with_context(
            product_context)
        product = product_with_context.browse(int(product_id))
        product_template = product.product_tmpl_id

        if res.get('line_id') and res.get('quantity') > 0:
            sale_order_line_obj = self.env['sale.order.line'].sudo().browse(
                res.get('line_id'))
            if sale_order_line_obj:
                sale_order = sale_order_line_obj.order_id
                old_qty = 0.0
                for line in sale_order.order_line:
                    if not line.is_bundle_item:
                        old_qty += line.product_uom_qty
                if product_template and product_template.sh_is_bundle and product_template.sh_bundle_product_ids:
                    line_ids = []
                    for bundle_product in product_template.sh_bundle_product_ids:
                        sh_order_line = sale_order.order_line.sudo().search([('order_id', '=', sale_order.id), (
                            'product_id', '=', bundle_product.sh_product_id.id), ('is_bundle_item', '=', True)],
                                                                            limit=1)
                        if not sh_order_line:
                            
                            product_line_vals = {
                                'order_id': sale_order.id,
                                'product_id': bundle_product.sh_product_id.id,
                                'name': f"{bundle_product.sh_product_id.name} ({product_template.name})",  # Añadir nombre del producto padre
                                'product_uom_qty': float(add_qty) * bundle_product.sh_qty,
                                'product_uom': bundle_product.sh_product_id.uom_id.id,
                                'price_unit': bundle_product.sh_price_unit,
                                'is_bundle_item': True,
                                'sh_bundle_initial_qty': bundle_product.sh_qty,
                            }
                            line_ids.append((0, 0, product_line_vals))
                            SaleOrderLineSudo.create(product_line_vals)
                        else:
                            if old_qty > 0.0:
                                sh_order_line.sudo().write({
                                    'product_uom_qty': old_qty * bundle_product.sh_qty
                                })
                    
                    # Después de crear las líneas de los productos hijos, eliminamos la línea del producto padre
                    sale_order_line_obj.sudo().unlink()

        return res