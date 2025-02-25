# Copyright (C) Softhealer Technologies.
# -*- coding: utf-8 -*-

from odoo import models, fields


class PosConfig(models.Model):
    _inherit = 'pos.config'

    sh_pos_enable_product_variants = fields.Boolean(
        string='Habilitar Variantes de Producto')
    sh_close_popup_after_single_selection = fields.Boolean(
        string='Cerrar automáticamente el popup después de seleccionar una variante')
    sh_pos_display_alternative_products = fields.Boolean(
        string='Mostrar Producto Alternativo')
    sh_pos_variants_group_by_attribute = fields.Boolean(
        string='Agrupar por Atributo', default=False)


class ProductTemplateInherit(models.Model):
    _inherit = 'product.template'

    sh_alternative_products = fields.Many2many(
        'product.product', 'sh_table_pos_alternative_products', string='Productos Alternativos', domain="[('available_in_pos', '=', True)]")