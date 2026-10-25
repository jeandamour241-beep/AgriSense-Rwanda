_______AgriSense Rwanda_______

An AI-Powered Agricultural Decision Support Platform for Rwanda

AgriSense Rwanda is an agricultural decision-support platform designed to help farmers, agricultural planners, and policymakers make more informed decisions using agricultural data and machine learning.

____The platform combines a 6 modules:

1. crop recommendations
2. irrigation decision support
3. pest and disease early warnings
4. fertilizer recommendations
5. agricultural data exploration
6. agricultural risk map

____Problem Statement:

Agriculture plays an important role in Rwanda's economy and livelihoods. However, farmers and agricultural stakeholders need accessible information to support decisions about crop selection, irrigation, pest and disease management, fertilizer use, and agricultural risks.

AgriSense Rwanda decided to make agricultural data more useful by presenting it through an accessible platform that combines data visualization, analytical tools, and machine-learning-based recommendations.

_____Project Objectives:

1. Make agricultural data easier to explore and understand.
2. Support crop selection using available agricultural data.
3. Provide irrigation decision support.
4. Help users explore historical pest and disease observations.
5. Provide fertilizer recommendations.
6. Visualize agricultural indicators across districts and seasons.
7. Support evidence-informed agricultural planning and decision-making.

_____6 modules:

____1. Crop Recommendation

As we know the various districts here in Rwanda grow different types of plants, depending on weather, types of soil, and etc.

So this module help farmers, agri planners, and policy maker to know a top 3 crops that can grow up well in watherever district and season they want.

A features you have to enter in order to get crop recommendation:

1. District(s1q2)
2. Season(season) 
3. Plot area(s2q2) this is hectale(ha)
4. Irrigation(s4q13)
5. Soil erosion(s4q1)
6. Land consolidation(s4q6)

why this features? because this features, they help Machine Learning model to predict well, and it help in historical observation.

____2. Irrigation Decision Assistant

Also because of weather in Rwanda districts is different, same districts have much rainfall weather and lot of sunny weather anothers have much sunny weather and lot of rainfall weather that different weathers have many effects to the Rwanda agriculture. thats why we built this module to help farmers, agri planners, and policymakers to know if they will need irrigation alot according to the district, season, and crops they plan to plant.

features needed to get irrigation advice:

1. Province(s1q1)
2. District(s1q2)
3. Stratum / Land Context(s1q3)
4. Agricultural Season(season)
5. Crop(s2q4)
6. Sowing Period(s2q7)
7. Seed Type(s2q11)
8. Plot Area (ha)(s2q2)
9. Soil Erosion(s4q1)
10. Land Consolidation(s4q6)

____3. Pest and Disease Early Warning

You know many farmers suffer losses due to pests-often unexpectedly. so this module help farmers to show them risk or probability of being attacked by pests, so that farmers can be ready before it happen.
This module like others it use NISR dataset to predict risk.

features needed to predict risk:

1. Province(s1q1)
2. District(s1q2)
3. Agricultural land stratum(s1q3)
4. Agricultural season(season)
5. Plot area (ha)(s2q2)
6. Crop grown on this plot(s2q4)
7. Sowing period(s2q7)
8. Type of seeds sown(s2q11)
9. Organic fertilizer used on any plot this season(s3q1)
10. Inorganic fertilizer used on any plot this season(s3q7)
11. Main source of fertilizer(s3q8)
12. Inorganic fertilizer used on this plot this season(s3q9)
13. Degree of soil erosion on this plot(s4q1)
14. Anti-erosion activity on any plot(s4q2)
15. Anti-erosion activity on this plot(s4q3)
16. Were anti-erosion activities done this season(s4q4)
17. Is this plot in a consolidated site this season(s4q6)
18. Mechanical equipment used on any plot this season(s4q8)
19. Irrigation practiced on any plot this season(s4q13)

____4. Fertilizer Recommendation Assistant

You know farmers they use fertilizer in order to get yield nearly and to make their crops grow up well, so you understand fertilizer is very important in agriculture in Rwanda. so this module helps farmers to know types of fertilizer(organic, inorganic, or if it is both) they need in order to get much productivity.

features needed to get fertilizer advices:

1. Province(s1q1)
2. District(s1q2)
3. Agricultural land stratum(s1q3)
4. Agricultural season(season)
5. Plot area (ha)(s2q2)
6. Crop grown on this plot(s2q4)
7. Sowing period(s2q7)
8. Type of seeds sown(s2q11)
9. Degree of soil erosion on this plot(s4q1)
10. Is this plot in a consolidated site this season(s4q6)

____5. Rwanda Agriculture Data Explorer

Allows farmers, agri planners, and policymakers to explore agricultural data and view relevant summaries and indicators. in this module farmers, agri planners, and policymakers they can select whathever they want to see where productivity is high or to see where crops produce high yield

____6. Agriculture Risk Map

Displays district-level agricultural indicators on a map. The available map views include pest and disease observations and irrigation-related information.

Map results depend on the available dataset, selected agricultural season, and implemented analysis.

_____Source of data used

1. we used Microdata for Rwanda Seasonal Agricultural Survey 2025 from NISR data

    . we used it as our dataset we used csv files. first of all we merged fertilizer_pest, agriculture_practice, and production file in all seasons. after we merged all seasons and then we cleaned merged data.

    the cleaned merged dataset is stored in AI_ML/data/all_data/all_seasons_cleaned_merged.csv

2. is geojson we used to design map of Rwanda in agriculture risk map from geoboundaries. we downloaded it on this link https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/RWA/ADM2/geoBoundaries-RWA-ADM2.geojson?utm_source=chatgpt.com. it stored in backend/src/agriculture-risk-map/data/rwanda_districts2.geojson

______Methodology

The development process includes:

1. Data inspection: Examining the available survey data, columns, missing values, and relevant agricultural variables.

2. Data preparation: Cleaning and preparing selected features for analysis and model development.

3. Feature selection: Selecting variables appropriate to the purpose of each module.

4. Model development: Training a machine-learning model for crop recommendation and implementing the analytical logic used by the other modules.

5. Backend integration: Exposing application functionality through backend API endpoints.

6. Visualization: Presenting agricultural information through dashboards, summaries, and district-level maps.

7. Evaluation and interpretation: Examining model performance and interpreting results in the context of the available data.

The platform combines machine-learning functionality with data analysis and visualization. Not every module should be interpreted as an independently trained machine-learning model.

______Technology Stack

Frontend: Next.js
Backend: NestJS
Machine Learning and Data Analysis: Python
Data Processing: Pandas, numpy and other Python libraries used in the project
Visualization: Dashboard components and map visualizations

______System Architecture

frontend(web folder) --> backend --> python(AI_ML)

frontend this help user to enter information in form and then send it easly.

backend it accept information from frontend then send it to AI_ML.

AI_ML this it accept information from backend and then put it in model according to module needed after model it provide response.

______The platform limitations:

1. Results depend on the quality, coverage, and variables available in the dataset.

2. Historical survey data should not be treated as live weather, outbreak, or field-sensor data.

3. District-level summaries may not represent conditions on every individual farm.

4. Recommendations should be validated using local agricultural knowledge and relevant expert guidance.

5. Further evaluation and validation are needed before using the outputs for high-impact agricultural decisions.

______Prerequisites

Install the following tools:

1. Node.js and npm
2. Python
3. Git

__1. Install Frontend Dependencies

Navigate to the frontend directory and install its dependencies:
    npm install

Start the frontend using the script defined in its package.json, for example: 
    npm run dev

__2. Install Backend Dependencies

Navigate to the NestJS backend directory and install its dependencies:
    npm install

Start the backend using the script defined in its package.json, for example:
    npm run start:dev

__3. Set Up the Python Environment

Navigate to the Python/AI_ML directory, create a virtual environment, and activate it.

On Windows PowerShell:
    python -m venv .venv
    .\.venv\Scripts\Activate.ps1

If the project contains a requirements.txt file, install the listed dependencies:
    pip install -r requirements.txt

______Intended Users and Expected Impact

The intended users include:

1. Farmers, agri planners, and policymakers seeking accessible agricultural decision support.

2. Agricultural extension workers supporting farmers.

3. Agricultural planners and policymakers exploring district-level information.

4. Researchers and other stakeholders interested in agricultural data.

The expected impact is to improve access to agricultural information, make survey data easier to explore, and support more evidence-informed decisions.

The platform is a decision-support tool, not a replacement for professional agricultural advice or field verification.

