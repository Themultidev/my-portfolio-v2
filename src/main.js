import'./style.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import emailjs from '@emailjs/browser';

AOS.init({
  duration: 1000,
  once: false,
});



const form = document.getElementById('contactForm');

form.addEventListener('submit', function (e) {
  e.preventDefault(); 

  emailjs.sendForm(
    import.meta.env.VITE_EMAILJS_SERVICE_ID,      
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID,   
    this,
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY      
  )
  .then(() => {
    alert("Message sent successfully!");
    this.reset(); // 
  })
  .catch((error) => {
    console.error("EmailJS error:", error);
    alert("Something went wrong. Please try again.");
  });
});
