
/*


--- SQL for Sales ---

see 180808sales.sql

--- SQL for DOB ---

See 181011dob.sql 

*/


create table dapmap6_2 as 
select borocode,
case when pluto.borough = 'MN' then 'Manhattan'
when pluto.borough = 'BX' then 'Bronx'
when pluto.borough = 'BK' then 'Brooklyn'
when pluto.borough = 'QN' then 'Queens'
else 'Staten Island' end as borough,
pluto.block, 
pluto.lot, 
pluto.bbl,  
pluto.zipcode, 
pluto.address, 
pluto.numbldgs,
pluto.unitsres, 
pluto.unitstotal - pluto.unitsres as unitscomm, 
pluto.yearbuilt,
a1, a2, dm, nb, total,
total*100/nullif(pluto.unitstotal,0) as dobscore,
uc2007,
uc2016,
case when uc2007 is not null and uc2016 is null then -100 
	when uc2007 is null and uc2016 is not null then 9999
	when uc2007 = 0 and uc2016 is not null then 9999
	else ((uc2016-uc2007)*100/uc2007) end as stabloss,
concat('https://hpdonline.hpdnyc.org/HPDonline/Provide_address.aspx?p1=',
      pluto.borocode,'&p2=', split_part(pluto.address,' ', 1),'&p3=',
      split_part(pluto.address,' ',2),'+',split_part(pluto.address,' ',3),'+',
      split_part(pluto.address,' ',4)) as hpdlink,
to_char((saledate), 'MM/DD/YYYY') as saledate,
left(saleprice::money::text, -3) as saleprice,
-- calculate a ppu label even if it's a coop, which will be sale price / 1
case when totalunits = 0 and saleprice is not null  and pluto.unitsres > 0 then
	left((saleprice/1)::money::text, -3)
	else left((saleprice / nullif(totalunits,0))::money::text, -3) end as ppu,
-- only calculate a ppu value for choropleth if it's not a coop 
saleprice/nullif(totalunits,0) as ppuval,
-- flag coops
case when totalunits = 0 and saleprice is not null  and pluto.unitsres > 0 then 'Coop Sale' else null end as coop,
evictions,
evictions*100/nullif(pluto.unitsres,0) as evicscore2
from pluto_18v1 pluto 
left join dap_dob181011 dob on dob.bbl = pluto.bbl
left join rentstab stab on ucbbl = pluto.bbl
left join dap_sales180808 sales on sales.bbl = pluto.bbl
left join evictions_bbl_2017 evics on evics.bbl = pluto.bbl;
 

update dapmap6_2
set 
dobscore = null,
stabloss = null,
ppu = null,
ppuval = null,
evictions = null,
evicscore2 = null
where unitsres = 0;

