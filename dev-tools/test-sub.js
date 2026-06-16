const url = "https://ewudkzyjcvjxxqpqnqiy.supabase.co/functions/v1/secure-payment";
const body = {
    action: "create_checkout",
    plan: "monthly",
    user_currency: "INR"
};
// We need a dummy JWT for the Edge Function Authorization.
// Actually, secure-payment uses auth from the request header: `const authHeader = req.headers.get('Authorization')!`
