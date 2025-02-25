# -*- coding: utf-8 -*-

from odoo import models, _, fields


class AccountMoveReversalInherit(models.TransientModel):
    _inherit = 'account.move.reversal'

    nro_ctrl = fields.Char(
        'Número de Control', size=32,
        help="Número utilizado para gestionar facturas preimpresas, por ley "
             "Necesito poner aquí este número para poder declarar"
             "Informes fiscales correctamente.", store=True)
    supplier_invoice_number = fields.Char(
        string='Número de factura del proveedor', size=64,
        store=True)

    def reverse_moves(self, is_modify=False):
        res = super().reverse_moves(is_modify=is_modify)
        credit_note = self.env["account.move"].browse(res["res_id"])
        moves_old = self.move_ids
        for rec in moves_old:
            credit_note.write({ "supplier_invoice_number": self.supplier_invoice_number,
                            "nro_ctrl": self.nro_ctrl,
                            })
        return res
