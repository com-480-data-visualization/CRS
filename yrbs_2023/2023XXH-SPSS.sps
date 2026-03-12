*
This SPSS syntax reads ASCII format (text format) 2023 YRBS data and creates a formatted 
and labeled SPSS data file that you can analyze in SPSS;
 
*
Change the file location specifications from "c:\yrbs2023" to the location where you have 
stored the SPSS syntax and the YRBS ASCII data file before you run this syntax;
Change the location specification in three places - in the "data list" statement at the top 
of the syntax and in the "save" and "get" statements at the end of the syntax;.
DATA LIST FILE="C:\yrbs2023\XXH2023_YRBS_Data.dat"/
Q1 17-17  
Q2 18-18  Q3 19-19  Q4 20-20  
Q5 21-28 (A) Q6 29-32  Q7 33-38  
Q8 39-39  Q9 40-40  Q10 41-41  
Q11 42-42  Q12 43-43  Q13 44-44  
Q14 45-45  Q15 46-46  Q16 47-47  
Q17 48-48  Q18 49-49  Q19 50-50  
Q20 51-51  Q21 52-52  Q22 53-53  
Q23 54-54  Q24 55-55  Q25 56-56  
Q26 57-57  Q27 58-58  Q28 59-59  
Q29 60-60  Q30 61-61  Q31 62-62  
Q32 63-63  Q33 64-64  Q34 65-65  
Q35 66-66  Q36 67-67  Q37 68-68  
Q38 69-69  Q39 70-70  Q40 71-71  
Q41 72-72  Q42 73-73  Q43 74-74  
Q44 75-75  Q45 76-76  Q46 77-77  
Q47 78-78  Q48 79-79  Q49 80-80  
Q50 81-81  Q51 82-82  Q52 83-83  
Q53 84-84  Q54 85-85  Q55 86-86  
Q56 87-87  Q57 88-88  Q58 89-89  
Q59 90-90  Q60 91-91  Q61 92-92  
Q62 93-93  Q63 94-94  Q64 95-95  
Q65 96-96  Q66 97-97  Q67 98-98  
Q68 99-99  Q69 100-100  Q70 101-101  
Q71 102-102  Q72 103-103  Q73 104-104  
Q74 105-105  Q75 106-106  Q76 107-107  
Q77 108-108  Q78 109-109  Q79 110-110  
Q80 111-111  Q81 112-112  Q82 113-113  
Q83 114-114  Q84 115-115  Q85 116-116  
Q86 117-117  Q87 118-118  Q88 119-119  
Q89 120-120  Q90 121-121  Q91 122-122  
Q92 123-123  Q93 124-124  Q94 125-125  
Q95 126-126  Q96 127-127  Q97 128-128  
Q98 129-129  Q99 130-130  Q100 131-131  
Q101 132-132  Q102 133-133  Q103 134-134  
Q104 135-135  Q105 136-136  Q106 137-137  
Q107 138-138  QN8 185-185  QN9 186-186  
QN10 187-187  QN11 188-188  QN12 189-189  
QN13 190-190  QN14 191-191  QN15 192-192  
QN16 193-193  QN17 194-194  QN18 195-195  
QN19 196-196  QN20 197-197  QN21 198-198  
QN22 199-199  QN23 200-200  QN24 201-201  
QN25 202-202  QN26 203-203  QN27 204-204  
QN28 205-205  QN29 206-206  QN30 207-207  
QN31 208-208  QN32 209-209  QN33 210-210  
QN34 211-211  QN35 212-212  QN36 213-213  
QN37 214-214  QN38 215-215  QN39 216-216  
QN40 217-217  QN41 218-218  QN42 219-219  
QN43 220-220  QN44 221-221  QN45 222-222  
QN46 223-223  QN47 224-224  QN48 225-225  
QN49 226-226  QN50 227-227  QN51 228-228  
QN52 229-229  QN53 230-230  QN54 231-231  
QN55 232-232  QN56 233-233  QN57 234-234  
QN58 235-235  QN59 236-236  QN60 237-237  
QN61 238-238  QN62 239-239  QN66 243-243  
QN67 244-244  QN68 245-245  QN69 246-246  
QN70 247-247  QN71 248-248  QN72 249-249  
QN73 250-250  QN74 251-251  QN75 252-252  
QN76 253-253  QN77 254-254  QN78 255-255  
QN79 256-256  QN80 257-257  QN81 258-258  
QN82 259-259  QN83 260-260  QN84 261-261  
QN85 262-262  QN86 263-263  QN87 264-264  
QN88 265-265  QN89 266-266  QN90 267-267  
QN91 268-268  QN92 269-269  QN93 270-270  
QN94 271-271  QN95 272-272  QN96 273-273  
QN97 274-274  QN98 275-275  QN99 276-276  
QN100 277-277  QN101 278-278  QN102 279-279  
QN103 280-280  QN104 281-281  QN105 282-282  
QN106 283-283  QN107 284-284  site 1-3 (A) 
qnfrcig 350-350  
qndaycig 351-351  qnfrevp 352-352  qndayevp 353-353  
qnfrskl 354-354  qndayskl 355-355  qnfrcgr 356-356  
qndaycgr 357-357  qntb2 358-358  qntb3 359-359  
qntb4 360-360  qntb5 361-361  qniudimp 362-362  
qnothhpl 363-363  qndualbc 364-364  qnbcnone 365-365  
qnfr0 366-366  qnfr1 367-367  qnfr2 368-368  
qnveg0 369-369  qnveg1 370-370  qnveg2 371-371  
qnveg3 372-372  qnsoda1 373-373  qnsoda2 374-374  
qnbk7day 375-375  qnpa0day 376-376  qnpa7day 377-377  
qndlype 378-378  qnnodnt 379-379  qnspdrk1 380-380  
qnspdrk2 381-381  qnwater1 382-382  qnwater2 383-383  
qnwater3 384-384  qnillict 385-385  qnobese 386-386  
qnowt 387-387  weight 388-397  stratum 398-400  
psu 401-406  bmipct 407-411  raceeth 414-415  
q6orig 416-418  q7orig 419-421.
EXECUTE.
 
VARIABLE LABELS
Q1 "How old are you"
Q2 "What is your sex"
Q3 "In what grade are you"
Q4 "Are you Hispanic/Latino"
Q5 "What is your race"
Q6 "How tall are you"
Q7 "How much do you weigh"
Q8 "Seat belt use"
Q9 "Riding with a drinking driver"
Q10 "Drinking and driving"
Q11 "Texting and driving"
Q12 "Weapon carrying at school"
Q13 "Gun carrying"
Q14 "Safety concerns at school"
Q15 "Threatened at school"
Q16 "Times in fight past 12 months"
Q17 "Physical fighting at school"
Q18 "Saw physical violence in neighborhood"
Q19 "Ever been physically forced sexual intercourse"
Q20 "Sexual violence"
Q21 "Sexual dating violence"
Q22 "Physical dating violence"
Q23 "treated unfairly in school b/c race/ethnicity"
Q24 "Bullied at school"
Q25 "Electronic bullying"
Q26 "Sad or hopeless"
Q27 "Considered suicide"
Q28 "Made a suicide plan past 12 months"
Q29 "Actually attempted suicide"
Q30 "Injurious suicide attempt"
Q31 "Ever cigarette use"
Q32 "Initiation of cigarette smoking"
Q33 "Current cigarette use"
Q34 "Smoked >10 cigarettes"
Q35 "Electronic vapor product use"
Q36 "Current electronic vapor product use"
Q37 "EVP from store"
Q38 "Current smokeless tobacco use"
Q39 "Current cigar use"
Q40 "All tobacco product cessation"
Q41 "Initiation of alcohol use"
Q42 "Current alcohol use"
Q43 "Current binge drinking"
Q44 "Drinks in a row past 30 days"
Q45 "Source of alcohol"
Q46 "Ever marijuana use"
Q47 "Initiation of marijuana use"
Q48 "Current marijuana use"
Q49 "Ever prescription pain medicine use"
Q50 "Ever cocaine use"
Q51 "Ever inhalant use"
Q52 "Ever heroin use"
Q53 "Ever methamphetamine use"
Q54 "Ever ecstasy use"
Q55 "Illegal injected drug use"
Q56 "Ever sexual intercourse"
Q57 "Sex before 13 years"
Q58 "Number of sex partners"
Q59 "Current sexual activity"
Q60 "Alcohol/drugs and sex"
Q61 "Condom use"
Q62 "Birth control pill use"
Q63 "Sex of sexual contacts"
Q64 "Sexual identity"
Q65 "Transgender"
Q66 "Perception of weight"
Q67 "Weight loss"
Q68 "Fruit juice drinking"
Q69 "Fruit eating"
Q70 "Green salad eating"
Q71 "Potato eating"
Q72 "Carrot eating"
Q73 "Other vegetable eating"
Q74 "No soda drinking"
Q75 "Breakfast eating"
Q76 "Physical activity >= 5 days"
Q77 "PE attendance"
Q78 "Sports team participation"
Q79 "Concussion"
Q80 "Social media"
Q81 "HIV testing"
Q82 "STD testing"
Q83 "Oral health care"
Q84 "Current mental health"
Q85 "Hours of sleep on school night"
Q86 "Unstable Housing"
Q87 "Grades in school"
Q88 "Ever sexual abuse by adult or older person ACEs"
Q89 "Ever parental emotional abuse ACEs"
Q90 "Ever parental physical abuse ACEs"
Q91 "Adults in home intimate partner violence ACEs"
Q92 "Current Rx Pain med w/out Rx"
Q93 "Ever used hallucinogenic drugs"
Q94 "If verbally asked for consent last sexual contact"
Q95 "Sports drinks"
Q96 "Plain water"
Q97 "Muscle strengthening"
Q98 "Sunburn"
Q99 "How often household adult met basic needs ACEs"
Q100 "Ever lived w/parent/guardian w/substance abuse ACE"
Q101 "Ever lived with parent/guardian w mental illness A"
Q102 "Ever incarcerated parent/guardian ACEs"
Q103 "Feel close to people at their school"
Q104 "Parental monitoring"
Q105 "Unfairly disciplined at school"
Q106 "Difficulty concentrating"
Q107 "How well speak English"
QN8 "Did not always wear a seat belt"
QN9 "Rode with a driver who had been drinking alcohol"
QN10 "Drove a car or other vehicle when they had been drinking alcohol"
QN11 "Texted or e-mailed while driving a car or other vehicle	"
QN12 "Carried a weapon on school property"
QN13 "Carried a gun"
QN14 "Did not go to school because they felt unsafe at school or on their way to or from school"
QN15 "Were threatened or injured with a weapon on school property"
QN16 "Were in a physical fight"
QN17 "Were in a physical fight on school property"
QN18 "Ever saw someone get physically attacked, beaten, stabbed, or shot in their neighborhood"
QN19 "Were ever physically forced to have sexual intercourse"
QN20 "Experienced sexual violence"
QN21 "Experienced sexual dating violence"
QN22 "Experienced physical dating violence"
QN23 "Felt that they were ever treated badly or unfairly in school because of their race or ethnicity"
QN24 "Were bullied on school property"
QN25 "Were electronically bullied"
QN26 "Felt sad or hopeless"
QN27 "Seriously considered attempting suicide"
QN28 "Made a plan about how they would attempt suicide"
QN29 "Attempted suicide"
QN30 "Had a suicide attempt that resulted in an injury, poisoning, or overdose that had to be treated by a doctor or nurse"
QN31 "Ever smoked a cigarette"
QN32 "Smoked a cigarette before age 13 years"
QN33 "Currently smoked cigarettes"
QN34 "Smoked more than 10 cigarettes per day"
QN35 "Ever used an electronic vapor product"
QN36 "Currently used an electronic vapor product"
QN37 "Usually got their electronic vapor products by buying them themselves in a convenience store, supermarket, discount store, or gas station"
QN38 "Currently used smokeless tobacco"
QN39 "Currently smoked cigars"
QN40 "Tried to quit using all tobacco products"
QN41 "Had their first drink of alcohol before age 13 years"
QN42 "Currently drank alcohol"
QN43 "Currently were binge drinking"
QN44 "Reported that the largest number of drinks they had in a row was 10 or more"
QN45 "Usually got the alcohol they drank by someone giving it to them"
QN46 "Ever used marijuana"
QN47 "tried marijuana for the first time before age 13 years"
QN48 "Currently used marijuana"
QN49 "Ever took prescription pain medicine without a doctor's prescription or differently than how a doctor told them to use it"
QN50 "Ever used cocaine"
QN51 "Ever used inhalants"
QN52 "Ever used heroin"
QN53 "Ever used methamphetamines"
QN54 "Ever used ecstasy"
QN55 "Ever injected any illegal drug"
QN56 "Ever had sexual intercourse"
QN57 "Had sexual intercourse for the first time before age 13 years"
QN58 "Had sexual intercourse with four or more persons during their life"
QN59 "Were currently sexually active"
QN60 "Drank alcohol or used drugs before last sexual intercourse"
QN61 "Used a condom during last sexual intercourse"
QN62 "Used birth control pills before last sexual intercourse with opposite-sex partner"
QN66 "Described themselves as slightly or very overweight"
QN67 "Were trying to lose weight"
QN68 "Did not drink fruit juice"
QN69 "Did not eat fruit"
QN70 "Did not eat green salad"
QN71 "Did not eat potatoes"
QN72 "Did not eat carrots"
QN73 "Did not eat other vegetables"
QN74 "Did not drink a can, bottle, or glass of soda or pop"
QN75 "Did not eat breakfast"
QN76 "Were physically active at least 60 minutes per day on 5 or more days"
QN77 "Attended physical education (PE) classes on 1 or more days"
QN78 "Played on at least one sports team"
QN79 "Had a concussion from playing a sport or being physically active"
QN80 "Used social media several times a day"
QN81 "Were ever tested for human immunodeficiency virus (HIV)"
QN82 "Were ever tested for a sexually transmitted disease (STD)"
QN83 "Saw a dentist"
QN84 "Reported that their mental health was most of the time or always not good"
QN85 "Got 8 or more hours of sleep"
QN86 "Experienced unstable housing"
QN87 "Described their grades in school as mostly A''s or B''s"
QN88 "Reported that an adult or person at least 5 years older than them ever made them do sexual things they did not want to do"
QN89 "Reported that a parent or other adult in their home most of the time or always insulted them or put them down"
QN90 "Reported that a parent or other adult in their home most of the time or always hit, beat, kicked, or physically hurt them in any way"
QN91 "Reported that their parents or other adults in their home most of the time or always slapped, hit, kicked, punched, or beat each other up"
QN92 "currently took prescription pain medicine without a doctor's prescription or differently than how a doctor told them to use it"
QN93 "ever used hallucinogenic drugs"
QN94 "Verbally asked for consent the last time they had sexual contact"
QN95 "did not drink a can, bottle, or glass of a sports drink"
QN96 "did not drink a bottle or glass of plain water"
QN97 "did exercises to strengthen or tone their muscles on three or more days"
QN98 "had a sunburn"
QN99 "Reported that an adult in their household most of the time or always tried to make sure their basic needs were met"
QN100 "ever lived with a parent or guardian who was having a problem with alcohol or drug use"
QN101 "ever lived with a parent or guardian who had severe depression, anxiety, or another mental illness, or was suicidal"
QN102 "Have ever been separated from a parent or guardian because they went to jail, prison, or a detention center"
QN103 "strongly agree or agree that they feel close to people at their school"
QN104 "reported that their parents or other adults in their family most of the time or always know where they are going or with whom they will be"
QN105 "have been unfairly disciplined at school"
QN106 "have serious difficulty concentrating, remembering, or making decisions"
QN107 "speak English well or very well"
site "Site Code"
qnfrcig "Currently smoked cigarettes frequently"
qndaycig "Currently smoked cigarettes daily"
qnfrevp "Currently used electronic vapor products frequently"
qndayevp "Currently used electronic vapor products daily"
qnfrskl "Currently used smokeless tobacco frequently"
qndayskl "Currently used smokeless tobacco daily"
qnfrcgr "Currently smoked cigars frequently"
qndaycgr "Currently smoked cigars daily"
qntb2 "Currently smoked cigarettes or cigars"
qntb3 "Currently smoked cigarettes or cigars or used smokeless tobacco"
qntb4 "Currently smoked cigarettes or cigars or used smokeless tobacco or electronic vapor products"
qntb5 "Currently smoked cigarettes or used electronic vapor products"
qniudimp "Used an IUD (such as Mirena or ParaGard) or implant (such as Implanon or Nexplanon) before last sexual intercourse with an opposite-sex partner"
qnothhpl "Used birth control pills; an IUD or implant; or a shot, patch, or birth control ring before last sexual intercourse with an opposite-sex partner"
qndualbc "Used both a condom during last sexual intercourse and birth control pills; an IUD or implant; or a shot, patch, or birth control ring before last sexual intercourse with an opposite-sex partner"
qnbcnone "Did not use any method to prevent pregnancy during last sexual intercourse with an opposite-sex partner"
qnfr0 "Did not eat fruit or drink 100% fruit juices"
qnfr1 "Ate fruit or drank 100% fruit juices one or more times per day"
qnfr2 "Ate fruit or drank 100% fruit juices two or more times per day"
qnveg0 "Did not eat vegetables"
qnveg1 "Ate vegetables one or more times per day"
qnveg2 "Ate vegetables two or more times per day"
qnveg3 "Ate vegetables three or more times per day"
qnsoda1 "Drank a can, bottle, or glass of soda or pop one or more times per day"
qnsoda2 "Drank a can, bottle, or glass of soda or pop two or more times per day"
qnbk7day "Ate breakfast on all 7 days"
qnpa0day "Did not participate in at least 60 minutes of physical activity on at least 1 day"
qnpa7day "Were physically active at least 60 minutes per day on all 7 days"
qndlype "Attended physical education classes on all 5 days"
qnnodnt "Never saw a dentist"
qnspdrk1 "Drank a can, bottle, or glass of a sports drink one or more times per day"
qnspdrk2 "Drank a can, bottle, or glass of a sports drink two or more times per day"
qnwater1 "Drank a bottle or glass of plain water one or more times per day"
qnwater2 "drank a bottle or glass of plain water two or more times per day"
qnwater3 "drank a bottle or glass of plain water three or more times per day"
qnillict "Ever used select illicit drugs"
qnobese "Had obesity"
qnowt "Were Overweight"
weight "Overall Analysis Weight"
stratum "Sampling Strata"
psu "Primary Sampling Unit"
bmipct "Body Mass Index Percentile"
raceeth "Race/Ethnicity"
q6orig "Original unedited student height"
q7orig "Original unedited student weight".
 
VALUE LABELS
Q1
1 "12 years old or younger"
2 "13 years old"
3 "14 years old"
4 "15 years old"
5 "16 years old"
6 "17 years old"
7 "18 years old or older"
/
Q2
1 "Female"
2 "Male"
/
Q3
1 "9th grade"
2 "10th grade"
3 "11th grade"
4 "12th grade"
5 "Ungraded or other grade"
/
Q4
1 "Yes"
2 "No"
/
Q8
1 "Never"
2 "Rarely"
3 "Sometimes"
4 "Most of the time"
5 "Always"
/
Q9
1 "0 times"
2 "1 time"
3 "2 or 3 times"
4 "4 or 5 times"
5 "6 or more times"
/
Q10
1 "Did not drive"
2 "Did not drive when drinking"
3 "1 time"
4 "2 or 3 times"
5 "4 or 5 times"
6 "6 or more times"
/
Q11
1 "Did not drive"
2 "Did not text while driving"
3 "1 or 2 days"
4 "3 to 5 days"
5 "6 to 9 days"
6 "10 to 19 days"
7 "20 to 29 days"
8 "All 30 days"
/
Q12
1 "0 days"
2 "1 day"
3 "2 or 3 days"
4 "4 or 5 days"
5 "6 or more days"
/
Q13
1 "0 days"
2 "1 day"
3 "2 or 3 days"
4 "4 or 5 days"
5 "6 or more days"
/
Q14
1 "0 days"
2 "1 day"
3 "2 or 3 days"
4 "4 or 5 days"
5 "6 or more days"
/
Q15
1 "0 times"
2 "1 time"
3 "2 or 3 times"
4 "4 or 5 times"
5 "6 or 7 times"
6 "8 or 9 times"
7 "10 or 11 times"
8 "12 or more times"
/
Q16
1 "0 times"
2 "1 time"
3 "2 or 3 times"
4 "4 or 5 times"
5 "6 or 7 times"
6 "8 or 9 times"
7 "10 or 11 times"
8 "12 or more times"
/
Q17
1 "0 times"
2 "1 time"
3 "2 or 3 times"
4 "4 or 5 times"
5 "6 or 7 times"
6 "8 or 9 times"
7 "10 or 11 times"
8 "12 or more times"
/
Q18
1 "Yes"
2 "No"
/
Q19
1 "Yes"
2 "No"
/
Q20
1 "0 times"
2 "1 time"
3 "2 or 3 times"
4 "4 or 5 times"
5 "6 or more times"
/
Q21
1 "Did not date"
2 "0 times"
3 "1 time"
4 "2 or 3 times"
5 "4 or 5 times"
6 "6 or more times"
/
Q22
1 "Did not date"
2 "0 times"
3 "1 time"
4 "2 or 3 times"
5 "4 or 5 times"
6 "6 or more times"
/
Q23
1 "Never"
2 "Rarely"
3 "Sometimes"
4 "Most of the time"
5 "Always"
/
Q24
1 "Yes"
2 "No"
/
Q25
1 "Yes"
2 "No"
/
Q26
1 "Yes"
2 "No"
/
Q27
1 "Yes"
2 "No"
/
Q28
1 "Yes"
2 "No"
/
Q29
1 "0 times"
2 "1 time"
3 "2 or 3 times"
4 "4 or 5 times"
5 "6 or more times"
/
Q30
1 "Did not attempt suicide"
2 "Yes"
3 "No"
/
Q31
1 "Yes"
2 "No"
/
Q32
1 "Never smoked a cigarette"
2 "8 years old or younger"
3 "9 or 10 years old"
4 "11 or 12 years old"
5 "13 or 14 years old"
6 "15 or 16 years old"
7 "17 years old or older"
/
Q33
1 "0 days"
2 "1 or 2 days"
3 "3 to 5 days"
4 "6 to 9 days"
5 "10 to 19 days"
6 "20 to 29 days"
7 "All 30 days"
/
Q34
1 "Did not smoke cigarettes"
2 "Less than 1 cigarette"
3 "1 cigarette"
4 "2 to 5 cigarettes"
5 "6 to 10 cigarettes"
6 "11 to 20 cigarettes"
7 "More than 20 cigarettes"
/
Q35
1 "Yes"
2 "No"
/
Q36
1 "0 days"
2 "1 or 2 days"
3 "3 to 5 days"
4 "6 to 9 days"
5 "10 to 19 days"
6 "20 to 29 days"
7 "All 30 days"
/
Q37
1 "Did not use EVP"
2 "Friend or family"
3 "Vape shop or tobacco shop"
4 "Store or gas station"
5 "Mall kiosk or stand"
6 "Internet"
7 "Took from a store"
8 "Some other way"
/
Q38
1 "0 days"
2 "1 or 2 days"
3 "3 to 5 days"
4 "6 to 9 days"
5 "10 to 19 days"
6 "20 to 29 days"
7 "All 30 days"
/
Q39
1 "0 days"
2 "1 or 2 days"
3 "3 to 5 days"
4 "6 to 9 days"
5 "10 to 19 days"
6 "20 to 29 days"
7 "All 30 days"
/
Q40
1 "Did not use tobacco products"
2 "Yes"
3 "No"
/
Q41
1 "Never drank alcohol"
2 "8 years old or younger"
3 "9 or 10 years old"
4 "11 or 12 years old"
5 "13 or 14 years old"
6 "15 or 16 years old"
7 "17 years old or older"
/
Q42
1 "0 days"
2 "1 or 2 days"
3 "3 to 5 days"
4 "6 to 9 days"
5 "10 to 19 days"
6 "20 to 29 days"
7 "All 30 days"
/
Q43
1 "0 days"
2 "1 day"
3 "2 days"
4 "3 to 5 days"
5 "6 to 9 days"
6 "10 to 19 days"
7 "20 or more days"
/
Q44
1 "Did not drink in past 30 days"
2 "1 or 2 drinks"
3 "3 drinks"
4 "4 drinks"
5 "5 drinks"
6 "6 or 7 drinks"
7 "8 or 9 drinks"
8 "10 or more drinks"
/
Q45
1 "Did not drink in past 30 days"
2 "Bought in store"
3 "Bought in restaurant"
4 "Bought at public event"
5 "I gave someone money to buy"
6 "Someone gave it to me"
7 "Took from store/family"
8 "Some other way"
/
Q46
1 "0 times"
2 "1 or 2 times"
3 "3 to 9 times"
4 "10 to 19 times"
5 "20 to 39 times"
6 "40 to 99 times"
7 "100 or more times"
/
Q47
1 "Never tried marijuana"
2 "8 years old or younger"
3 "9 or 10 years old"
4 "11 or 12 years old"
5 "13 or 14 years old"
6 "15 or 16 years old"
7 "17 years old or older"
/
Q48
1 "0 times"
2 "1 or 2 times"
3 "3 to 9 times"
4 "10 to 19 times"
5 "20 to 39 times"
6 "40 or more times"
/
Q49
1 "0 times"
2 "1 or 2 times"
3 "3 to 9 times"
4 "10 to 19 times"
5 "20 to 39 times"
6 "40 or more times"
/
Q50
1 "0 times"
2 "1 or 2 times"
3 "3 to 9 times"
4 "10 to 19 times"
5 "20 to 39 times"
6 "40 or more times"
/
Q51
1 "0 times"
2 "1 or 2 times"
3 "3 to 9 times"
4 "10 to 19 times"
5 "20 to 39 times"
6 "40 or more times"
/
Q52
1 "0 times"
2 "1 or 2 times"
3 "3 to 9 times"
4 "10 to 19 times"
5 "20 to 39 times"
6 "40 or more times"
/
Q53
1 "0 times"
2 "1 or 2 times"
3 "3 to 9 times"
4 "10 to 19 times"
5 "20 to 39 times"
6 "40 or more times"
/
Q54
1 "0 times"
2 "1 or 2 times"
3 "3 to 9 times"
4 "10 to 19 times"
5 "20 to 39 times"
6 "40 or more times"
/
Q55
1 "0 times"
2 "1 time"
3 "2 or more times"
/
Q56
1 "Yes"
2 "No"
/
Q57
1 "Never had sex"
2 "11 years old or younger"
3 "12 years old"
4 "13 years old"
5 "14 years old"
6 "15 years old"
7 "16 years old"
8 "17 years old or older"
/
Q58
1 "Never had sex"
2 "1 person"
3 "2 people"
4 "3 people"
5 "4 people"
6 "5 people"
7 "6 or more people"
/
Q59
1 "Never had sex"
2 "None during past 3 months"
3 "1 person"
4 "2 people"
5 "3 people"
6 "4 people"
7 "5 people"
8 "6 or more people"
/
Q60
1 "Never had sex"
2 "Yes"
3 "No"
/
Q61
1 "Never had sex"
2 "Yes"
3 "No"
/
Q62
1 "Never had sex"
2 "No birth control"
3 "Birth control pills"
4 "Condoms"
5 "IUD or implant"
6 "Shot/patch/birth control ring"
7 "Withdrawal or something else"
8 "Not sure"
/
Q63
1 "Never had sexual contact"
2 "Females"
3 "Males"
4 "Females and males"
/
Q64
1 "Heterosexual (straight)"
2 "Gay or lesbian"
3 "Bisexual"
4 "Some other way"
5 "Not sure"
6 "Don't know what this means"
/
Q65
1 "No"
2 "Yes, I am transgender"
3 "Not sure if I am transgender"
4 "Don't know what this means"
/
Q66
1 "Very underweight"
2 "Slightly underweight"
3 "About the right weight"
4 "Slightly overweight"
5 "Very overweight"
/
Q67
1 "Lose weight"
2 "Gain weight"
3 "Stay the same weight"
4 "Not trying to do anything"
/
Q68
1 "Did not drink fruit juice"
2 "1 to 3 times"
3 "4 to 6 times"
4 "1 time per day"
5 "2 times per day"
6 "3 times per day"
7 "4 or more times per day"
/
Q69
1 "Did not eat fruit"
2 "1 to 3 times"
3 "4 to 6 times"
4 "1 time per day"
5 "2 times per day"
6 "3 times per day"
7 "4 or more times per day"
/
Q70
1 "Did not eat green salad"
2 "1 to 3 times"
3 "4 to 6 times"
4 "1 time per day"
5 "2 times per day"
6 "3 times per day"
7 "4 or more times per day"
/
Q71
1 "Did not eat potatoes"
2 "1 to 3 times"
3 "4 to 6 times"
4 "1 time per day"
5 "2 times per day"
6 "3 times per day"
7 "4 or more times per day"
/
Q72
1 "Did not eat carrots"
2 "1 to 3 times"
3 "4 to 6 times"
4 "1 time per day"
5 "2 times per day"
6 "3 times per day"
7 "4 or more times per day"
/
Q73
1 "Did not eat other vegetables"
2 "1 to 3 times"
3 "4 to 6 times"
4 "1 time per day"
5 "2 times per day"
6 "3 times per day"
7 "4 or more times per day"
/
Q74
1 "Did not drink soda or pop"
2 "1 to 3 times"
3 "4 to 6 times"
4 "1 time per day"
5 "2 times per day"
6 "3 times per day"
7 "4 or more times per day"
/
Q75
1 "0 days"
2 "1 day"
3 "2 days"
4 "3 days"
5 "4 days"
6 "5 days"
7 "6 days"
8 "7 days"
/
Q76
1 "0 days"
2 "1 day"
3 "2 days"
4 "3 days"
5 "4 days"
6 "5 days"
7 "6 days"
8 "7 days"
/
Q77
1 "0 days"
2 "1 day"
3 "2 days"
4 "3 days"
5 "4 days"
6 "5 days"
/
Q78
1 "0 teams"
2 "1 team"
3 "2 teams"
4 "3 or more teams"
/
Q79
1 "0 times"
2 "1 time"
3 "2 times"
4 "3 times"
5 "4 or more times"
/
Q80
1 "I do not use social media"
2 "A few times a month"
3 "About once a week"
4 "A few times a week"
5 "About once a day"
6 "Several times a day"
7 "About once an hour"
8 "More than once an hour"
/
Q81
1 "Yes"
2 "No"
3 "Not sure"
/
Q82
1 "Yes"
2 "No"
3 "Not sure"
/
Q83
1 "During the past 12 months"
2 "Between 12 and 24 months ago"
3 "More than 24 months ago"
4 "Never"
5 "Not sure"
/
Q84
1 "Never"
2 "Rarely"
3 "Sometimes"
4 "Most of the time"
5 "Always"
/
Q85
1 "4 or less hours"
2 "5 hours"
3 "6 hours"
4 "7 hours"
5 "8 hours"
6 "9 hours"
7 "10 or more hours"
/
Q86
1 "Home of parent or gaurdian"
2 "Home of other people"
3 "Shelter or emergency housing"
4 "Motel or hotel"
5 "Public place"
6 "No usual place"
7 "Somewhere else"
/
Q87
1 "Mostly A's"
2 "Mostly B's"
3 "Mostly C's"
4 "Mostly D's"
5 "Mostly F's"
6 "None of these grades"
7 "Not sure"
/
Q88
1 "Yes"
2 "No"
/
Q89
1 "Never"
2 "Rarely"
3 "Sometimes"
4 "Most of the time"
5 "Always"
/
Q90
1 "Never"
2 "Rarely"
3 "Sometimes"
4 "Most of the time"
5 "Always"
/
Q91
1 "Never"
2 "Rarely"
3 "Sometimes"
4 "Most of the time"
5 "Always"
/
Q92
1 "0 times"
2 "1 or 2 times"
3 "3 to 9 times"
4 "10 to 19 times"
5 "20 to 39 times"
6 "40 or more times"
/
Q93
1 "0 times"
2 "1 or 2 times"
3 "3 to 9 times"
4 "10 to 19 times"
5 "20 to 39 times"
6 "40 or more times"
/
Q94
1 "Never had sexual contact"
2 "Yes"
3 "No"
/
Q95
1 "I did not drink"
2 "1 to 3 times"
3 "4 to 6 times"
4 "1 time per day"
5 "2 times per day"
6 "3 times per day"
7 "4 or more times per day"
/
Q96
1 "Did not drink water"
2 "1 to 3 times"
3 "4 to 6 times"
4 "1 time per day"
5 "2 times per day"
6 "3 times per day"
7 "4 or more times per day"
/
Q97
1 "0 days"
2 "1 day"
3 "2 days"
4 "3 days"
5 "4 days"
6 "5 days"
7 "6 days"
8 "7 days"
/
Q98
1 "0 times"
2 "1 time"
3 "2 times"
4 "3 times"
5 "4 times"
6 "5 or more times"
/
Q99
1 "Never"
2 "Rarely"
3 "Sometimes"
4 "Most of the time"
5 "Always"
/
Q100
1 "Yes"
2 "No"
/
Q101
1 "Yes"
2 "No"
/
Q102
1 "Yes"
2 "No"
/
Q103
1 "Strongly agree"
2 "Agree"
3 "Not sure"
4 "Disagree"
5 "Strongly disagree"
/
Q104
1 "Never"
2 "Rarely"
3 "Sometimes"
4 "Most of the time"
5 "Always"
/
Q105
1 "Yes"
2 "No"
/
Q106
1 "Yes"
2 "No"
/
Q107
1 "Very well"
2 "Well"
3 "Not well"
4 "Not at all"
/
RACEETH
1 "Am Indian/Alaska Native"
2 "Asian"
3 "Black or African American"
4 "Native Hawaiian/Other PI"
5 "White"
6 "Hispanic / Latino"
7 "Multiple - Hispanic"
8 "Multiple - Non-Hispanic"
/.

MISSING VALUES
Q1 (" ") 
Q2 (" ") Q3 (" ") Q4 (" ") 
Q5 ("        ") Q6 ("    ") Q7 ("      ") 
Q8 (" ") Q9 (" ") Q10 (" ") 
Q11 (" ") Q12 (" ") Q13 (" ") 
Q14 (" ") Q15 (" ") Q16 (" ") 
Q17 (" ") Q18 (" ") Q19 (" ") 
Q20 (" ") Q21 (" ") Q22 (" ") 
Q23 (" ") Q24 (" ") Q25 (" ") 
Q26 (" ") Q27 (" ") Q28 (" ") 
Q29 (" ") Q30 (" ") Q31 (" ") 
Q32 (" ") Q33 (" ") Q34 (" ") 
Q35 (" ") Q36 (" ") Q37 (" ") 
Q38 (" ") Q39 (" ") Q40 (" ") 
Q41 (" ") Q42 (" ") Q43 (" ") 
Q44 (" ") Q45 (" ") Q46 (" ") 
Q47 (" ") Q48 (" ") Q49 (" ") 
Q50 (" ") Q51 (" ") Q52 (" ") 
Q53 (" ") Q54 (" ") Q55 (" ") 
Q56 (" ") Q57 (" ") Q58 (" ") 
Q59 (" ") Q60 (" ") Q61 (" ") 
Q62 (" ") Q63 (" ") Q64 (" ") 
Q65 (" ") Q66 (" ") Q67 (" ") 
Q68 (" ") Q69 (" ") Q70 (" ") 
Q71 (" ") Q72 (" ") Q73 (" ") 
Q74 (" ") Q75 (" ") Q76 (" ") 
Q77 (" ") Q78 (" ") Q79 (" ") 
Q80 (" ") Q81 (" ") Q82 (" ") 
Q83 (" ") Q84 (" ") Q85 (" ") 
Q86 (" ") Q87 (" ") Q88 (" ") 
Q89 (" ") Q90 (" ") Q91 (" ") 
Q92 (" ") Q93 (" ") Q94 (" ") 
Q95 (" ") Q96 (" ") Q97 (" ") 
Q98 (" ") Q99 (" ") Q100 (" ") 
Q101 (" ") Q102 (" ") Q103 (" ") 
Q104 (" ") Q105 (" ") Q106 (" ") 
Q107 (" ") QN8 (" ") QN9 (" ") 
QN10 (" ") QN11 (" ") QN12 (" ") 
QN13 (" ") QN14 (" ") QN15 (" ") 
QN16 (" ") QN17 (" ") QN18 (" ") 
QN19 (" ") QN20 (" ") QN21 (" ") 
QN22 (" ") QN23 (" ") QN24 (" ") 
QN25 (" ") QN26 (" ") QN27 (" ") 
QN28 (" ") QN29 (" ") QN30 (" ") 
QN31 (" ") QN32 (" ") QN33 (" ") 
QN34 (" ") QN35 (" ") QN36 (" ") 
QN37 (" ") QN38 (" ") QN39 (" ") 
QN40 (" ") QN41 (" ") QN42 (" ") 
QN43 (" ") QN44 (" ") QN45 (" ") 
QN46 (" ") QN47 (" ") QN48 (" ") 
QN49 (" ") QN50 (" ") QN51 (" ") 
QN52 (" ") QN53 (" ") QN54 (" ") 
QN55 (" ") QN56 (" ") QN57 (" ") 
QN58 (" ") QN59 (" ") QN60 (" ") 
QN61 (" ") QN62 (" ") QN66 (" ") 
QN67 (" ") QN68 (" ") QN69 (" ") 
QN70 (" ") QN71 (" ") QN72 (" ") 
QN73 (" ") QN74 (" ") QN75 (" ") 
QN76 (" ") QN77 (" ") QN78 (" ") 
QN79 (" ") QN80 (" ") QN81 (" ") 
QN82 (" ") QN83 (" ") QN84 (" ") 
QN85 (" ") QN86 (" ") QN87 (" ") 
QN88 (" ") QN89 (" ") QN90 (" ") 
QN91 (" ") QN92 (" ") QN93 (" ") 
QN94 (" ") QN95 (" ") QN96 (" ") 
QN97 (" ") QN98 (" ") QN99 (" ") 
QN100 (" ") QN101 (" ") QN102 (" ") 
QN103 (" ") QN104 (" ") QN105 (" ") 
QN106 (" ") QN107 (" ") site ("   ") 
qnfrcig (" ") 
qndaycig (" ") qnfrevp (" ") qndayevp (" ") 
qnfrskl (" ") qndayskl (" ") qnfrcgr (" ") 
qndaycgr (" ") qntb2 (" ") qntb3 (" ") 
qntb4 (" ") qntb5 (" ") qniudimp (" ") 
qnothhpl (" ") qndualbc (" ") qnbcnone (" ") 
qnfr0 (" ") qnfr1 (" ") qnfr2 (" ") 
qnveg0 (" ") qnveg1 (" ") qnveg2 (" ") 
qnveg3 (" ") qnsoda1 (" ") qnsoda2 (" ") 
qnbk7day (" ") qnpa0day (" ") qnpa7day (" ") 
qndlype (" ") qnnodnt (" ") qnspdrk1 (" ") 
qnspdrk2 (" ") qnwater1 (" ") qnwater2 (" ") 
qnwater3 (" ") qnillict (" ") qnobese (" ") 
qnowt (" ") weight ("          ") stratum ("   ") 
psu ("      ") bmipct ("     ") raceeth ("  ") 
q6orig ("   ") q7orig ("   ") .

Formats q6 q7 (F5.2) .
EXECUTE.
SAVE OUTFILE="C:\yrbs2023\yrbs2023.sav"/
/COMPRESSED.
EXECUTE.
 
GET FILE "C:\yrbs2023\yrbs2023.sav".
