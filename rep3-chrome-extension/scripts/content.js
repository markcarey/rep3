

$( document ).ready(function() {

  $("#mainaddress").each(async function(){
    const address = $(this).text();
    // TODO: fetch average rating
    const res = await fetch(`https://api.rep3.bio/api/profile/${address}`, { 
      method: 'GET', 
      headers: {
          "Content-Type": "application/json"
      }
    });
    var user = await res.json();
    const stars = user.average;
    const html = `
      <span id="ContentPlaceHolder1_rep3" style="margin-left: 0.75rem!important;">
        <a id="rep3" data-address="${address}" class="link-secondary" href="https://rep3.bio/profile/${address}" data-bs-toggle="tooltip" data-bs-trigger="hover" aria-label="Click to view Rep3 Profile">
          <i class="far fa-star"></i> ${stars} Stars
        </a>
      </span>
    `;
    $("#ContentPlaceHolder1_copyButtonPanel").after(html);
  });



});