# coding: utf-8
# Part of Odoo. See LICENSE file for full copyright and licensing details.
import logging
import requests
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError



_logger = logging.getLogger(__name__)



class PosConfig(models.Model):
    _inherit = "pos.config"

    vpos = fields.Boolean(string="VPOS")
    vpos_restApi = fields.Char("VPOS Terminal Url", default="http://localhost:8085")


class VPOSActions(models.Model):
    _name = "vpos.actions"
    _description = "VPOS Actions"

    @api.model
    def _vpos_execute(self, action, pos_config_id):
        pos_config = self.env["pos.config"].browse(pos_config_id)
        url = pos_config.vpos_restApi

        if not url:
            raise ValidationError(
                "La URL de la API REST de VPOS no está definida para esta configuración de POS"
            )

        _logger.debug(f"Executing VPOS action '{action}' with URL: {url}")

        try:
            print(requests.post(
                f"{url}/vpos/metodo",
                json={"accion": action},
                headers={"Content-Type": "application/json"},
            ))
            response = requests.post(
                f"{url}/vpos/metodo",
                json={"accion": action},
                headers={"Content-Type": "application/json"},
            )

            _logger.debug(
                f"Received response: {response.status_code} - {response.text}"
            )
            response.raise_for_status()
            

            result = response.json()

            if result.get("codRespuesta") not in ["00", "100"]:
                raise ValidationError(
                    result.get("mensajeRespuesta", "Unknown error occurred")
                )

            return result
        except requests.RequestException as e:
            _logger.error(f"Error connecting to VPOS for action '{action}': {str(e)}")
            raise ValidationError(
                f"No se puede conectar con VPOS para la acción '{action}'"
            )
        except ValueError as e:
            _logger.error(f"VPOS error for action '{action}': {str(e)}")
            raise ValidationError(
                f"Se produjo un error inesperado durante la acción VPOS '{action}'"
            )
        except Exception as e:
            _logger.error(f"Unexpected error in VPOS action '{action}': {str(e)}")
            raise ValidationError(
                f"Se produjo un error inesperado durante la acción VPOS '{action}'"
            )


class VPOSActionsWizard(models.TransientModel):
    _name = "vpos.actions.wizard"
    _description = "VPOS Actions Wizard"

    action = fields.Selection(
        [
            ("anulacion", "Anulación"),
            ("imprimeUltimoVoucher", "Impresión de última transacción aprobada"),
            ("imprimeUltimoVoucherP", "Impresión de última transacción procesada"),
            ("precierre", "Pre-cierre"),
            ("cierre", "Cierre"),
            ("ultimoCierre", "Último cierre"),
        ],
        string="Action",
        required=True,
    )
    pos_config_id = fields.Many2one("pos.config", string="POS Config", required=True)

    def execute_action(self):
        self.ensure_one()
        vpos_actions = self.env["vpos.actions"]
        try:
            result = vpos_actions._vpos_execute(self.action, self.pos_config_id.id)
            return {
                "type": "ir.actions.client",
                "tag": "display_notification",
                "params": {
                    "title": "Success",
                    "message": f"VPOS acion '{self.action}' ejecutado exitosamente",
                    "type": "success",
                    "sticky": False,
                },
            }
        except ValueError as e:
            return {
                "type": "ir.actions.client",
                "tag": "display_notification",
                "params": {
                    "title": "Error",
                    "message": str(e),
                    "type": "danger",
                    "sticky": False,
                },
            }
