/**
 * ScholarSphere Service – Epic 6
 * ------------------------------------------------------------
 *  ‣ Project memory (attractors, morphs, analogies)
 *  ‣ Context-aware & sequential-pattern recommendations
 *  ‣ Field-driven reuse helpers
 *  ‣ Memory-lattice visualisation + clustering
 * ------------------------------------------------------------
 *  NOTE: Many API methods are demo stubs; swap with real calls.
 */

/* ───────────────────────────────── Imports ─────────────────────────────── */
import dynamicalSystemsService from './dynamicalSystemsService';
// import conceptGraphService   from './conceptGraphService';   // future use

/* ───────────────────────────── API Adapters ────────────────────────────── */
class SemanticScholarAdapter {
  constructor () {
    this.baseUrl = 'https://api.semanticscholar.org/v1';
    this.apiKey  = null;                      // injected in production
  }
  async fetchPaperMetadata (paperId) {
    console.log(`[SS] meta ${paperId}`);
    return {
      paperId,
      title  : `Example Paper ${paperId}`,
      authors: [{ authorId:'a1', name:'Jane Smith' },
                { authorId:'a2', name:'John Doe' }],
      year   : 2024,
      venue  : 'Demo Conf',
      abstract: 'Stub abstract.',
      citationCount: 42,
      influentialCitationCount: 12,
      references: [{ paperId:'ref1', title:'Ref 1' },
                   { paperId:'ref2', title:'Ref 2' }],
      citations : [{ paperId:'cite1', title:'Cite 1' },
                   { paperId:'cite2', title:'Cite 2' }]
    };
  }
  async searchByKeyword (query, limit = 10) {
    console.log(`[SS] search "${query}"`);
    return Array(limit).fill().map((_,i)=>({
      paperId : `result${i+1}`,
      title   : `Result ${i+1} for ${query}`,
      authors : [{ authorId:`ax${i}`, name:`Author ${i}` }],
      year    : 2020 + (i % 5),
      abstract: `Discusses ${query}.`,
      citationCount: Math.floor(Math.random()*100)
    }));
  }
  async fetchCitationNetwork (paperId, depth = 1) {
    console.log(`[SS] net ${paperId}`);
    return {
      nodes: Array(20).fill().map((_,i)=>({
        id:`paper${i}`, title:`Paper ${i}`,
        year:2010+(i%15), citationCount:Math.floor(Math.random()*200)
      })),
      edges: Array(40).fill().map((_,i)=>({
        source:`paper${Math.floor(i/2)}`,
        target:`paper${(Math.floor(i/2)+1+Math.floor(Math.random()*5))%20}`,
        type: Math.random()>0.7 ? 'citation' : 'reference'
      }))
    };
  }
}

class CrossRefAdapter {
  constructor () { this.baseUrl='https://api.crossref.org'; }
  async search (query) {
    console.log(`[CrossRef] "${query}"`);
    return Array(5).fill().map((_,i)=>({
      doi:`10.1234/example.${i}`, title:`CR ${i} for ${query}`,
      author:[`A${i}`], published:`202${i}`
    }));
  }
  async getByDoi (doi) {
    console.log(`[CrossRef] ${doi}`);
    return {
      doi, title:`Paper ${doi}`, published:'2023',
      type:'article', author:['A','B']
    };
  }
}

/* ───────────────────────────── Core Service ────────────────────────────── */
class ScholarSphereService {

  constructor () {
    /* external */
    this.adapters = {
      semanticScholar: new SemanticScholarAdapter(),
      crossRef       : new CrossRefAdapter()
    };

    /* graph */
    this.scholarGraph = {
      nodes       : new Map(),  // id → { id,type,label,metadata }
      edges       : new Map(),  // id → { id,source,target,type,metadata }
      timeSlices  : new Map(),
      publications: new Map(),  // id → paper
      authors     : new Map(),  // id → author
      venues      : new Map()   // id → venue
    };

    /* memory */
    this.projectMemory = {
      attractorPatterns: [],
      morphSequences   : [],
      analogies        : []
    };

    /* mapping */
    this.dynamicalMapping = {
      conceptToAttractor : new Map(),
      attractorToConcept : new Map()
    };

    /* cache */
    this.cache = {
      searchResults   : new Map(),
      visualizations  : new Map(),
      citationNetworks: new Map()
    };

    /* recommendation params */
    this.contextAwareWeights = {
      recency   : 0.30,
      relevance : 0.40,
      popularity: 0.20,
      diversity : 0.10
    };

    /* sequential pattern state */
    this.sequentialPatterns = {
      userSequences  : [],
      minSupport     : 0.10,
      frequentPatterns: []
    };
  }

  /* ─────────────────────── Utility: cosine sim ─────────────────────── */
  _cos (a,b) {
    const n = Math.min(a.length,b.length);
    let dot=0, ma=0, mb=0;
    for (let i=0;i<n;i++){ dot+=a[i]*b[i]; ma+=a[i]*a[i]; mb+=b[i]*b[i]; }
    return ma&&mb ? dot/(Math.sqrt(ma)*Math.sqrt(mb)) : 0;
  }

  /* ───────────────────────── Demo data loader ───────────────────────── */
  initWithDemoData () {
    /* publications */
    const papers = Array(20).fill().map((_,i)=>({
      id:`paper${i}`, title:`Example Paper ${i}`,
      authors:[`author${i%5}`,`author${(i+2)%5}`],
      year:2010+(i%15), venue:`Venue${i%3}`,
      abstract:`Abstract ${i}`, keywords:['kw',`topic${i%5}`],
      citationCount:Math.floor(Math.random()*100)
    }));
    papers.forEach(p=>{
      this.scholarGraph.publications.set(p.id,p);
      this.scholarGraph.nodes.set(p.id,{
        id:p.id,type:'publication',label:p.title,
        metadata:{ year:p.year,citationCount:p.citationCount }
      });
    });

    /* authors */
    const authors = Array(5).fill().map((_,i)=>({
      id:`author${i}`, name:`Author ${i}`, affiliation:`Uni ${i}`,
      papers:papers.filter(p=>p.authors.includes(`author${i}`)).map(p=>p.id),
      hIndex:Math.floor(Math.random()*30)
    }));
    authors.forEach(a=>{
      this.scholarGraph.authors.set(a.id,a);
      this.scholarGraph.nodes.set(a.id,{
        id:a.id,type:'author',label:a.name,
        metadata:{ affiliation:a.affiliation, hIndex:a.hIndex }
      });
    });

    /* venues */
    const venues = Array(3).fill().map((_,i)=>({
      id:`venue${i}`, name:`Venue ${i}`, type:i?'conference':'journal',
      papers:papers.filter(p=>p.venue===`Venue${i}`).map(p=>p.id),
      impactFactor:1+Math.random()*9
    }));
    venues.forEach(v=>this.scholarGraph.venues.set(v.id,v));

    /* citation edges */
    const citations = Array(40).fill().map((_,i)=>{
      const c1=papers[Math.floor(Math.random()*papers.length)];
      const c2=papers[Math.floor(Math.random()*papers.length)];
      if(c1.id===c2.id || c1.year<c2.year) return null;
      return {
        id:`cit${i}`, source:c1.id, target:c2.id, type:'citation',
        metadata:{ year:c1.year, context:`Ctx ${i}` }
      };
    }).filter(Boolean);
    citations.forEach(e=>this.scholarGraph.edges.set(e.id,e));

    /* attractor patterns */
    const attractors = Array(5).fill().map((_,i)=>({
      id:`attr${i}`,
      pattern:Array(64).fill().map(()=>Math.random()*2-1),
      label:`Attr ${i}`,
      conceptIds:[papers[i*2].id,papers[i*2+1].id],
      timestamp:Date.now()-i*86_400_000
    }));
    this.projectMemory.attractorPatterns = attractors;
    attractors.forEach(at=>{
      at.conceptIds.forEach(cid=>{
        this.dynamicalMapping.conceptToAttractor.set(cid,at.id);
        if(!this.dynamicalMapping.attractorToConcept.has(at.id))
          this.dynamicalMapping.attractorToConcept.set(at.id,[]);
        this.dynamicalMapping.attractorToConcept.get(at.id).push(cid);
      });
    });

    /* morph sequences */
    const morphs = Array(3).fill().map((_,i)=>{
      const b=attractors[i].pattern;
      const states=Array(5).fill().map((__,k)=>b.map(v=>v+(Math.random()*0.4-0.2)*(k/4)));
      return {
        id:`morph${i}`, states,
        description:`Morph ${i}`,
        conceptIds:[attractors[i].conceptIds[0]],
        timestamp:Date.now()-i*43_200_000
      };
    });
    this.projectMemory.morphSequences = morphs;

    /* analogies */
    this.projectMemory.analogies = [{
      id:'analogy1',
      source:{ pattern:attractors[0].pattern, concepts:attractors[0].conceptIds },
      target:{ pattern:attractors[1].pattern, concepts:attractors[1].conceptIds },
      mappings:[{
        sourceId:attractors[0].conceptIds[0],
        targetId:attractors[1].conceptIds[0],
        strength:0.80
      }],
      description:'Demo analogy',
      timestamp:Date.now()-86_400_000
    }];

    /* sequential user sequences */
    this.sequentialPatterns.userSequences = Array(10).fill().map(()=>{
      return papers.sort(()=>Math.random()-0.5)
                   .slice(0,Math.floor(Math.random()*5)+3)
                   .map(p=>p.id);
    });

    console.log('🌱  ScholarSphere demo data loaded');
    return true;
  }

  /* ──────────────── Search / metadata / network ──────────────── */
  async searchPapers (query,{limit=10,source='semanticScholar',useCache=true}={}) {
    const key=`${source}_${query}_${limit}`;
    if(useCache && this.cache.searchResults.has(key))
      return this.cache.searchResults.get(key);

    let results;
    if(source==='semanticScholar')      results=await this.adapters.semanticScholar.searchByKeyword(query,limit);
    else if(source==='crossRef')        results=await this.adapters.crossRef.search(query);
    else                                results=await this.adapters.semanticScholar.searchByKeyword(query,limit);

    this.cache.searchResults.set(key,results);
    return results;
  }

  async getPaperMetadata (paperId) {
    if(this.scholarGraph.publications.has(paperId))
      return this.scholarGraph.publications.get(paperId);
    const md = await this.adapters.semanticScholar.fetchPaperMetadata(paperId);
    this.scholarGraph.publications.set(paperId,md);
    return md;
  }

  async getCitationNetwork (paperId,{depth=1,includeCocitation=true,useCache=true}={}) {
    const key=`${paperId}_${depth}_${includeCocitation}`;
    if(useCache && this.cache.citationNetworks.has(key))
      return this.cache.citationNetworks.get(key);

    let net;
    if(this.scholarGraph.publications.has(paperId))
      net=this._buildNetworkInternal(paperId,depth,includeCocitation);
    else
      net=await this.adapters.semanticScholar.fetchCitationNetwork(paperId,depth);

    this.cache.citationNetworks.set(key,net);
    return net;
  }

  _buildNetworkInternal (centerId,depth,includeCocit) {
    const visited = new Set([centerId]);
    const keepN   = new Set([centerId]);
    const keepE   = new Set();
    const q=[{id:centerId,d:0}];

    while(q.length){
      const {id,d}=q.shift();
      if(d>=depth) continue;
      for(const [eid,e] of this.scholarGraph.edges){
        if(e.type!=='citation') continue;
        if(e.source===id && !visited.has(e.target)){
          visited.add(e.target); keepN.add(e.target); keepE.add(eid);
          q.push({id:e.target,d:d+1});
        }
        if(e.target===id && !visited.has(e.source)){
          visited.add(e.source); keepN.add(e.source); keepE.add(eid);
          q.push({id:e.source,d:d+1});
        }
      }
    }

    if(includeCocit){
      const citedBy=new Map();
      for(const [,e] of this.scholarGraph.edges)
        if(e.type==='citation' && keepN.has(e.target)){
          if(!citedBy.has(e.target)) citedBy.set(e.target,new Set());
          citedBy.get(e.target).add(e.source);
        }

      for(const [p1,s1] of citedBy)
        for(const [p2,s2] of citedBy)
          if(p1!==p2){
            const common=[...s1].filter(x=>s2.has(x));
            if(common.length>=2){
              const id=`co_${p1}_${p2}`;
              const edge={
                id, source:p1, target:p2, type:'cocitation',
                metadata:{ weight:common.length, common }
              };
              this.scholarGraph.edges.set(id,edge); keepE.add(id);
            }
          }
    }

    const nodes=[...keepN].map(id=>({ ...this.scholarGraph.nodes.get(id) }));
    const edges=[...keepE].map(id=>({ ...this.scholarGraph.edges.get(id) }));
    return { nodes, edges };
  }

  /* ─────────────── Recording helpers ─────────────── */
  recordAttractorPattern (pattern,label,conceptIds=[]) {
    const id=`attr_${Date.now()}`;
    const e={ id, pattern:[...pattern], label, conceptIds:[...conceptIds], timestamp:Date.now() };
    this.projectMemory.attractorPatterns.push(e);
    conceptIds.forEach(cid=>{
      this.dynamicalMapping.conceptToAttractor.set(cid,id);
      if(!this.dynamicalMapping.attractorToConcept.has(id))
        this.dynamicalMapping.attractorToConcept.set(id,[]);
      this.dynamicalMapping.attractorToConcept.get(id).push(cid);
    });
    return id;
  }

  recordMorphSequence (states,description,conceptIds=[]) {
    const id=`morph_${Date.now()}`;
    this.projectMemory.morphSequences.push({
      id, states:states.map(s=>[...s]), description,
      conceptIds:[...conceptIds], timestamp:Date.now()
    });
    return id;
  }

  recordAnalogy (sourcePattern,targetPattern,mappings,description) {
    const id=`analogy_${Date.now()}`;
    this.projectMemory.analogies.push({
      id, source:{...sourcePattern}, target:{...targetPattern},
      mappings:[...mappings], description, timestamp:Date.now()
    });
    return id;
  }

  /* ───────────── Similarity / analogies ───────────── */
  findSimilarPatterns (state,{threshold=0.7,maxResults=5,useSpectral=false}={}) {
    if(!this.projectMemory.attractorPatterns.length) return [];
    const sims=this.projectMemory.attractorPatterns.map(p=>{
      let s;
      try {
        s = useSpectral
          ? dynamicalSystemsService.compareSpectralSignatures(state,p.pattern)
          : this._cos(state,p.pattern);
      } catch { s=this._cos(state,p.pattern); }
      return{
        patternId:p.id,label:p.label,similarity:s,
        conceptIds:p.conceptIds,timestamp:p.timestamp
      };
    });
    return sims.filter(x=>x.similarity>=threshold)
               .sort((a,b)=>b.similarity-a.similarity)
               .slice(0,maxResults);
  }

  findAnalogies ({ conceptId, patternId, pattern, threshold=0.6, maxResults=5 }={}) {
    if(conceptId){
      return this.projectMemory.analogies
        .filter(a=>a.source.concepts.includes(conceptId) ||
                   a.target.concepts.includes(conceptId) ||
                   a.mappings.some(m=>m.sourceId===conceptId||m.targetId===conceptId))
        .slice(0,maxResults);
    }
    const pat = patternId
      ? this.projectMemory.attractorPatterns.find(p=>p.id===patternId)?.pattern
      : pattern;
    if(!pat) return [];
    return this._analogiesForPattern(pat,{threshold,maxResults});
  }

  _analogiesForPattern (pat,{threshold,maxResults}){
    const sims=this.projectMemory.analogies.map(a=>{
      const s=Math.max(this._cos(pat,a.source.pattern),
                       this._cos(pat,a.target.pattern));
      return{a,s};
    });
    return sims.filter(x=>x.s>=threshold)
               .sort((a,b)=>b.s-a.s)
               .slice(0,maxResults)
               .map(x=>x.a);
  }

  /* ───────────── Memory-lattice visualisation ───────────── */
  getMemoryLatticeVisualization ({
    includePapers=true,
    includeAuthors=true,
    includeCitations=true,
    includeAttractors=true,
    timeSlice=null,
    layout='force',
    clustering=true
  }={}){
    const nodes=[...this.scholarGraph.nodes.values()].filter(n=>{
      if(!includePapers      && n.type==='publication') return false;
      if(!includeAuthors     && n.type==='author')      return false;
      if(!includeAttractors  && n.type==='attractor')   return false;
      if(timeSlice && n.metadata?.year && n.metadata.year>timeSlice) return false;
      return true;
    });
    const edges=[...this.scholarGraph.edges.values()].filter(e=>{
      if(!includeCitations   && e.type==='citation') return false;
      if(!includeAuthors     && e.type==='authorship') return false;
      if(timeSlice && e.metadata?.year && e.metadata.year>timeSlice) return false;
      return nodes.find(n=>n.id===e.source)&&nodes.find(n=>n.id===e.target);
    });

    let clusters=[];
    if(clustering){
      clusters=this.getClusteredMemoryLattice({nodes,edges});
      clusters.forEach(c=>{
        const n=nodes.find(x=>x.id===c.nodeId);
        if(n) n.clusterId=c.clusterId;
      });
    }

    const vis={nodes,edges,clusters,layout};
    this.cache.visualizations.set(JSON.stringify(arguments[0]||{}),vis);
    return vis;
  }

  getClusteredMemoryLattice ({nodes=[],edges=[]}={}){
    const adj=Object.fromEntries(nodes.map(n=>[n.id,new Set()]));
    edges.forEach(e=>{
      adj[e.source]?.add(e.target);
      adj[e.target]?.add(e.source);
    });

    const visited=new Set(); const res=[]; let cid=0;
    const dfs=id=>{
      visited.add(id);
      res.push({nodeId:id,clusterId:`c${cid}`});
      adj[id].forEach(n=>!visited.has(n)&&dfs(n));
    };
    nodes.forEach(n=>{ if(!visited.has(n.id)){ dfs(n.id); cid++; } });
    return res;
  }

  getInteractiveVisualizationControls (){
    return{
      sliders:[
        {id:'year',label:'Max year',min:2000,max:new Date().getFullYear(),step:1}
      ],
      toggles:[
        {id:'showAuthors',label:'Authors',default:true},
        {id:'showCitations',label:'Citations',default:true}
      ],
      buttons:[
        {id:'layoutRefresh',label:'Re-layout'}
      ]
    };
  }

  /* ─────────── Context-aware recommendations (Story 6.2) ─────────── */
  generateContextAwareRecommendations (ctx={},limit=10){
    const { recentPapers=[], interestVector=null, keywords=[] } = ctx;
    const now=Date.now();
    const candidates=[...this.scholarGraph.publications.values()]
                      .filter(p=>!recentPapers.includes(p.id));

    const scored=candidates.map(p=>{
      const recency=Math.max(0,1-((now-new Date(p.year||2020,0,1))/(10*365*86_400_000)));
      const popularity=Math.log10(1+(p.citationCount||1))/3;
      let relevance=0;
      if(interestVector && p.embedding) relevance=this._cos(interestVector,p.embedding);
      else if(keywords.length && p.keywords) relevance=p.keywords.some(k=>keywords.includes(k))?1:0;
      const diversity=Math.random();
      const score=
        recency   *this.contextAwareWeights.recency   +
        relevance *this.contextAwareWeights.relevance +
        popularity*this.contextAwareWeights.popularity+
        diversity *this.contextAwareWeights.diversity ;
      return{pub:p,score};
    });
    return scored.sort((a,b)=>b.score-a.score).slice(0,limit).map(x=>x.pub);
  }

  identifySequentialPatterns (){
    const seqs=this.sequentialPatterns.userSequences;
    if(!seqs.length) return [];
    const counts=new Map();
    seqs.forEach(seq=>{
      for(let i=0;i<seq.length;i++)
        for(let j=i+1;j<=Math.min(i+4,seq.length);j++){
          const sub=seq.slice(i,j).join('→');
          counts.set(sub,(counts.get(sub)||0)+1);
        }
    });
    const min=Math.ceil(this.sequentialPatterns.minSupport*seqs.length);
    this.sequentialPatterns.frequentPatterns=[...counts]
      .filter(([,c])=>c>=min)
      .map(([pat,c])=>({pattern:pat.split('→'),support:c/seqs.length}))
      .sort((a,b)=>b.support-a.support);
    return this.sequentialPatterns.frequentPatterns;
  }

  adaptToUserContext ({likedTypes=[],dislikedTypes=[]}={}){
    const w=this.contextAwareWeights;
    const bump=(k,d)=>{w[k]=Math.min(1,Math.max(0,w[k]+d));};
    if(likedTypes.includes('novelty')) bump('diversity',0.05);
    if(likedTypes.includes('recent'))  bump('recency',0.05);
    if(dislikedTypes.includes('popular')) bump('popularity',-0.05);
    return {...w};
  }

  /* ─────────────── Field-driven reuse (Story 6.2) ─────────────── */
  generateReuseOpportunities (conceptIds=[],limit=5){
    const outs=[];
    conceptIds.forEach(cid=>{
      const n=this.scholarGraph.nodes.get(cid);
      if(!n) return;
      const sims=[...this.scholarGraph.nodes.values()]
        .filter(m=>m.id!==cid && m.type===n.type)
        .map(m=>({base:cid,candidate:m.id,similarity:Math.random()}));
      outs.push(...sims);
    });
    return outs.sort((a,b)=>b.similarity-a.similarity).slice(0,limit);
  }

  generateAdaptationSteps (sourcePatternId,targetPatternId,steps=4){
    const s=this.projectMemory.attractorPatterns.find(p=>p.id===sourcePatternId);
    const t=this.projectMemory.attractorPatterns.find(p=>p.id===targetPatternId);
    if(!s||!t) return [];
    const diff=s.pattern.map((v,i)=>t.pattern[i]-v);
    return Array(steps).fill().map((_,k)=>
      s.pattern.map((v,i)=>v+diff[i]*((k+1)/(steps+1)))
    );
  }
}

/* ────────────────────────── Singleton export ────────────────────────── */
const scholarSphereService = new ScholarSphereService();
export default scholarSphereService;
