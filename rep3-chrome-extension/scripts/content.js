const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
};

async function getRatingForAddress(address) {
  return new Promise(async (resolve, reject) => {
    const res = await fetch(`https://api.rep3.bio/api/profile/${address}`, { 
      method: 'GET', 
      headers: {
          "Content-Type": "application/json"
      }
    });
    var user = await res.json();
    resolve(user);
  });
}

async function getRatingForNFT(blockchain, address, tokenId) {
  return new Promise(async (resolve, reject) => {
    const res = await fetch(`https://api.rep3.bio/api/nft/${blockchain}/${address}/${tokenId}`, { 
      method: 'GET', 
      headers: {
          "Content-Type": "application/json"
      }
    });
    var user = await res.json();
    resolve(user);
  });
}

$( document ).ready(function() {


  // etherscan
  $("#mainaddress").each(async function(){
    const address = $(this).text();
    // fetch average rating
    const profile = await getRatingForAddress(address);
    const stars = profile.average;
    const html = `
      <span id="ContentPlaceHolder1_rep3" style="margin-left: 0.75rem!important;">
        <a id="rep3" data-address="${address}" class="link-secondary" href="https://rep3.bio/profile/${address}" data-bs-toggle="tooltip" data-bs-trigger="hover" aria-label="Click to view Rep3 Profile">
          <i class="far fa-star"></i> ${stars} Stars
        </a>
      </span>
    `;
    $("#ContentPlaceHolder1_copyButtonPanel").append(html);
  });

  // opensea
  $("section.item--counts").find("button:last-child").each(async function(){
    const opensea = $("section.item--counts").find("button:nth-child(2)").html();
    if ( opensea ) {
      const path = window.location.pathname.split('/');
      // fetch average rating
      const profile = await getRatingForNFT(path[2], path[3], path[4]);
      const stars = profile.average;
      $(".item--counts").find("button:last-child").after($("section.item--counts").find("button:nth-child(2)").clone());
      $(".item--counts").find("button:last-child").css("margin-left", "24px").find("i").text("star_border").parents("button").find("span").text(`${stars} stars`);
      $(".item--counts").find("button:last-child").click(function(){
        window.location = `https://rep3.bio/nft/${path[2]}/${path[3]}/${path[4]}`;
      });
    }
  });

  // tokenbound
  $(".flex.items-center.justify-between:first-child").first().each(async function(){
    await sleep(2000);
    $(".flex.items-center.justify-between.space-x-1").find("a.cursor-pointer:last-child").first().each(async function(){
      const path = window.location.pathname.split('/');
      // fetch average rating
      const profile = await getRatingForNFT(path[2], path[3], path[4]);
      const stars = profile.average;
      const rep3Url = `https://rep3.bio/nft/${path[2]}/${path[3]}/${path[4]}`;
      $(".flex.items-center.justify-between.space-x-1").append(`<a target="_blank" rel="noopener noreferrer" href="${rep3Url}" class="cursor-pointer" style=""><svg fill="#000000" height="20px" width="20px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 217.929 217.929" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M212.39,101.703c5.023-4.897,6.797-12.083,4.629-18.755s-7.827-11.443-14.769-12.452l-52.969-7.697 c-0.097-0.014-0.18-0.075-0.223-0.162L125.371,14.64C122.267,8.349,115.98,4.44,108.964,4.44S95.662,8.349,92.558,14.64 L68.87,62.637c-0.043,0.087-0.126,0.147-0.223,0.162l-52.968,7.697c-6.942,1.009-12.601,5.78-14.769,12.452 s-0.394,13.858,4.629,18.755l38.328,37.361c0.07,0.068,0.102,0.166,0.085,0.262l-9.048,52.755 c-1.186,6.914,1.604,13.771,7.279,17.894c5.676,4.125,13.059,4.657,19.268,1.393l47.376-24.907c0.086-0.046,0.19-0.045,0.276,0 l47.376,24.907c2.701,1.42,5.623,2.121,8.531,2.121c3.777,0,7.53-1.184,10.736-3.514c5.675-4.123,8.464-10.98,7.279-17.895 l-9.048-52.754c-0.017-0.096,0.016-0.194,0.085-0.262L212.39,101.703z M156.235,142.368l9.048,52.754 c0.024,0.14,0.031,0.182-0.118,0.29c-0.149,0.108-0.187,0.088-0.312,0.022l-47.377-24.908c-5.33-2.801-11.695-2.801-17.027,0 l-47.376,24.907c-0.125,0.065-0.163,0.086-0.312-0.022c-0.149-0.108-0.142-0.15-0.118-0.289l9.048-52.755 c1.018-5.936-0.949-11.989-5.262-16.194L18.103,88.813c-0.101-0.099-0.132-0.128-0.075-0.303c0.057-0.175,0.099-0.181,0.239-0.202 l52.968-7.697c5.961-0.866,11.111-4.607,13.776-10.008l23.688-47.998c0.063-0.126,0.081-0.165,0.265-0.165s0.203,0.039,0.265,0.165 l23.688,47.998c2.666,5.401,7.815,9.143,13.776,10.008l52.968,7.697c0.14,0.021,0.182,0.027,0.239,0.202 c0.057,0.175,0.026,0.205-0.075,0.303l-38.328,37.361C157.185,130.378,155.218,136.432,156.235,142.368z"></path> </g> </g></svg></a><a href="${rep3Url}" style="margin-left: 10px;">${stars} Stars</a>`);
    });
  });
  

});