const width = 1200;
const height = 1000;

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const { cluster: mapNodeToCluster }  = clustersData;
const uniqueClusters = [...new Set(Object.values(mapNodeToCluster))];
const mapClusterToColor = uniqueClusters.reduce((acc, cluster) => ({...acc, [cluster]: getRandomColor()}), {});

const cluster = d3.layout.cluster().size([height, width]);

const svg = d3.select('body').append('svg')
  .attr('width', width)
  .attr('height', height)
  .append('g')
  .attr('transform', 'translate(100,0)');
const ys = [];

const getXYfromJSONTree = node => {
  ys.push(node.node_dist);
  if (typeof node.children != 'undefined') {
    for (let j in node.children) {
      getXYfromJSONTree(node.children[j]);
    }
  }
};

let ymax = Number.MIN_VALUE;
let ymin = Number.MAX_VALUE;

getXYfromJSONTree(data); // data from ./data.js
const nodes = cluster.nodes(data);
const links = cluster.links(nodes);
nodes.forEach((d, i) => {
  if (typeof ys[i] != 'undefined') { d.y = ys[i]; }
  if (d.y > ymax) ymax = d.y;
  if (d.y < ymin) ymin = d.y;
});

const scale = d3.scale.linear().domain([ymin, ymax]).range([0, height]);
const scaleInv = d3.scale.linear().domain([ymax, ymin]).range([0, height]);

const elbow = (d, i) => {
   if(d.source.name === 'Root1'){ // temporary solution
     return null;
  }
  return 'M' + d.source.x + ',' + scale(d.source.y)
    + 'H' + d.target.x + 'V' + scale(d.target.y) ;
};

svg.selectAll('.link')
  .data(links)
  .enter().append('path')
  .attr('class', 'link')
  .attr('style', d =>  {
    const nodes = d.source.name.split('-');
    const firstNode = nodes[0];
    const color = mapClusterToColor[mapNodeToCluster[firstNode]];
    return `stroke: ${color}`
  })
  .attr('d', elbow);

const node = svg.selectAll('.node')
  .data(nodes)
  .enter().append('g')
  .attr('class', 'node')
  .attr('transform', d =>  'translate(' + d.x + ',' + scale(d.y) + ')');

// node.append('circle')
//   .attr('r', 0.5);

const g = d3.select('svg').append('g')
  .attr('transform', 'translate(100,40)');

g.selectAll('.label')
  .data(scale.ticks(5))
  .enter().append('text')
  .attr('class', 'label')
  .text(String)
  .attr('y', d => scaleInv(d))
  .attr('x', -5)
  .attr('text-anchor', 'middle');

svg.attr('transform', `rotate(180, ${width / 2}, ${height / 2})`);
