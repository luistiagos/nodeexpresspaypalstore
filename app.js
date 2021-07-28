const express = require('express');
const cors = require('cors');
const request = require('request');
const emailer = require('./mail');
const requestIp = require('request-ip');

const app = express();
app.use(express.urlencoded({ extended: true }))
app.use(cors())

/**
 * 1️⃣ Paso
 * Crear una aplicacion en Ppaypal
 * Aqui agregamos las credenciales de nuestra app de PAYPAL
 * https://developer.paypal.com/developer/applications (Debemos acceder con nuestra cuenta de Paypal)
 * [Cuentas de TEST] https://developer.paypal.com/developer/accounts/
 */

const CLIENT = 'AWreWRc4QZFBpialedogiTk3GZT53fUWMib5Tdqn540XuIj_vV2mKpLPhBFAaP3pzkObd0C9Mmw-w0F5';
const SECRET = 'EBNtCZ9jUu4RztOQA2RSStxCLXKhZNUAdB_4OOjO88cBv9ivEgenzHu4fLVLAXD1Vgjx_aT4ZdNML4xB';
const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // Live https://api-m.paypal.com
const HOST = 'localhost';
const PORT = 3000;
const BASE_URL = 'http://' + HOST + ':' + PORT;

const auth = { user: CLIENT, pass: SECRET }


const sendmail = (req, res) => {
    emailer.sendEmail().then(
        (r) => {
            res.send(r);
        },
        (err) => {
            res.send(err);
        }
    );
}

/**
 * Establecemos los contraladores que vamos a usar
 */

const createPayment = (req, res) => {

    const body = {
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: 'BRL', //https://developer.paypal.com/docs/api/reference/currency-codes/
                value: '1'
            }
        }],
        application_context: {
            brand_name: `MiTienda.com`,
            landing_page: 'NO_PREFERENCE', // Default, para mas informacion https://developer.paypal.com/docs/api/orders/v2/#definition-order_application_context
            user_action: 'PAY_NOW', // Accion para que en paypal muestre el monto del pago
            return_url: BASE_URL + '/execute-payment', // Url despues de realizar el pago
            cancel_url: BASE_URL + '/cancel-payment' // Url despues de realizar el pago
        }
    }
    //https://api-m.sandbox.paypal.com/v2/checkout/orders [POST]

    request.post(`${PAYPAL_API}/v2/checkout/orders`, {
        auth,
        body,
        json: true
    }, (err, response) => {
        res.json({ data: response.body })
    })
}

/**
 * Esta funcion captura el dinero REALMENTE
 * @param {*} req 
 * @param {*} res 
 */
const executePayment = (req, res) => {
    const token = req.query.token; //<-----------

    request.post(`${PAYPAL_API}/v2/checkout/orders/${token}/capture`, {
        auth,
        body: {},
        json: true
    }, (err, response) => {
        res.json({ data: response.body })
    })
}
/**
 * ⚡⚡⚡⚡⚡⚡  1️⃣
 * @param {*} req 
 * @param {*} res 
 */
const createProduct = (req, res) => {
    const product = {
        name: 'Subscripcion Youtube',
        description: "Subscripcion a un canal de Youtube se cobra mensualmente",
        type: 'SERVICE',
        category: 'SOFTWARE',
        image_url: 'https://avatars.githubusercontent.com/u/15802366?s=460&u=ac6cc646599f2ed6c4699a74b15192a29177f85a&v=4'

    }

    //https://developer.paypal.com/docs/api/catalog-products/v1/#products_create
    request.post(`${PAYPAL_API}/v1/catalogs/products`, {
        auth,
        body: product,
        json: true
    }, (err, response) => {
        res.json({ data: response.body })
    })
}

/**
 * ⚡⚡⚡⚡⚡⚡  2️⃣
 * @param {*} req 
 * @param {*} res 
 */
const createPlan = (req, res) => {
    const { body } = req
    //product_id

    const plan = {
        name: 'PLAN mensual',
        product_id: body.product_id,
        status: "ACTIVE",
        billing_cycles: [
            {
                frequency: {
                    interval_unit: "MONTH",
                    interval_count: 1
                },
                tenure_type: "REGULAR",
                sequence: 1,
                total_cycles: 12,
                pricing_scheme: {
                    fixed_price: {
                        value: "3", // PRECIO MENSUAL QUE COBRAS 3.30USD
                        currency_code: "USD"
                    }
                }
            }],
        payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee: {
                value: "10",
                currency_code: "USD"
            },
            setup_fee_failure_action: "CONTINUE",
            payment_failure_threshold: 3
        },
        taxes: {
            percentage: "10", // 10USD + 10% = 11 USD
            inclusive: false
        }
    }

    request.post(`${PAYPAL_API}/v1/billing/plans`, {
        auth,
        body: plan,
        json: true
    }, (err, response) => {
        res.json({ data: response.body })
    })
}

/**
 * ⚡⚡⚡⚡⚡⚡  3️⃣
 * @param {*} req 
 * @param {*} res 
 */
const generateSubscription = (req, res) => {
    const { body } = req

    const subscription = {
        plan_id: body.plan_id, //P-3HK92642FR4448515MBQHCYQ
        start_time: "2021-11-01T00:00:00Z",
        quantity: 1,
        subscriber: {
            name: {
                given_name: "Leifer",
                surname: "Mendez"
            },
            email_address: "customer@example.com",
        },
        return_url: BASE_URL + '/gracias',
        cancel_url: BASE_URL + '/fallo'

    }
    request.post(`${PAYPAL_API}/v1/billing/subscriptions`, {
        auth,
        body: subscription,
        json: true
    }, (err, response) => {
        res.json({ data: response.body })
    })
}

app.get(`/sendmail`, sendmail)

/**
 * 2️⃣ Creamos Ruta para generar pagina de CHECKOUT
 */

//    http://localhost:3000/create-payment [POST]
app.post(`/create-payment`, createPayment)

/**
 * 3️⃣ Creamos Ruta para luego que el cliente completa el checkout 
 * debemos de capturar el dinero!
 */

app.get(`/execute-payment`, executePayment)


app.get('/test', (req, res) => {
    const idAddress = requestIp.getClientIp(req);
	res.send(idAddress);
})

//--------------------------------- SUBSCRIPCIONES --------------------------------------

/**
 * ⚡ Crear producto en PAYPAL
 */

app.post(`/create-product`, createProduct)

/**
 * ⚡ Crear plan en PAYPAL
 */

app.post(`/create-plan`, createPlan)

/**
 * ⚡ Crear subscripcion en PAYPAL
 */

app.post(`/generate-subscription`, generateSubscription)



app.listen(PORT, () => {
    console.log(`Comenzemos a generar dinero --> ` + BASE_URL);
})
