var user = { "average": 4.6 };
const stars = user.average;

$( document ).ready(function() {

  $("#mainaddress").each(async function(){
    const address = $(this).text();
    // fetch average rating
    //const res = await fetch(`https://api.rep3.bio/api/profile/${address}`, { 
    //  method: 'GET', 
    //  headers: {
    //      "Content-Type": "application/json"
    //  }
    //});
    //var user = await res.json();
    const html = `
      <span id="ContentPlaceHolder1_rep3" style="margin-left: 0.75rem!important;">
        <a id="rep3" data-address="${address}" class="link-secondary" href="https://rep3.bio/profile/${address}" data-bs-toggle="tooltip" data-bs-trigger="hover" aria-label="Click to view Rep3 Profile">
          <i class="far fa-star"></i> ${stars} Stars
        </a>
      </span>
    `;
    $("#ContentPlaceHolder1_copyButtonPanel").append(html);
  });

  const opensea = $("section.item--counts").find("button:nth-child(2)").html();
  if ( opensea ) {
    $(".item--counts").find("button:last-child").after($("section.item--counts").find("button:nth-child(2)").clone());
    $(".item--counts").find("button:last-child").css("margin-left", "24px").find("i").text("star_border").parents("button").find("span").text(`${stars} stars`);
    $(".item--counts").find("button:last-child").click(function(){
      const path = window.location.pathname.split('/');
      window.location = `https://rep3.bio/nft/${path[2]}/${path[3]}/${path[4]}`;
    });
  }


});