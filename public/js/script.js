const checkoutType = "redirect"; // or 'modal'

// Render the checkout button
Tingg.renderPayButton({
  text: "pay with tingg",
  color: "green",
  className: "awesome-checkout-button",
});

document
  .querySelector(".awesome-checkout-button")
  .addEventListener("click", function () {
    //Call the encryption URL to encrypt the params and render checkout
    function encrypt() {
      return fetch("<YOUR_ENCRYPTION_ENDPOINT>", {
        method: "POST",
        body: JSON.stringify(payload),
        mode: "cors",
      }).then((response) => response.json());
    }
    encrypt()
      .then((response) => {
        // Render the checkout page on click event
        Tingg.renderCheckout({
          test: Boolean,
          checkout_type: "",
          checkout_payload: {
            encrypted_payload: "",
            access_key: "",
          },
        });
      })
      .catch((error) => console.log(error));
  });
