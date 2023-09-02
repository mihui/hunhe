'use client';
import styles from './page.module.scss';
import MarkdownIt from 'markdown-it';

const mark = MarkdownIt({
   highlight: function (str, language) {
      return '';
   }
});

const txt = `

Value Pools:
1. Operational Efficiency and Cost
   - Reduction in training costs
   - Decrease in the time taken for training programs
   - Streamlined training processes

2. User Experience
   - Improved customer service interactions
   - Effective problem-solving and issue resolution
   - Personalized and empathetic customer engagement

3. Strategic Capability Build
   - Development of a skilled and knowledgeable workforce
   - Ability to adapt to changing customer needs
   - Enhanced brand reputation and differentiation

Three Value Drivers:
1. Training and development programs
   - Tailored training modules for different customer service roles
   - Focus on both technical and soft skills development
   - Ongoing training and continuous improvement programs

2. Tools and resources available to customer service representatives
   - Access to customer information and historical data
   - Integration of customer relationship management (CRM) systems
   - Adoption of advanced analytics and artificial intelligence technologies

3. Collaborative problem-solving within the customer service team
   - Encouraging knowledge sharing and cross-functional collaboration
   - Establishing effective communication channels
   - Providing opportunities for feedback and idea generation

One or more Value Levers:
1. Training effectiveness and efficiency
   - Deployment of interactive and engaging training methods
   - Regular assessment and evaluation of training outcomes
   - Utilization of digital training platforms for scalability

2. Improved access to relevant customer data and information
   - Integration of CRM systems with customer service tools
   - Implementation of comprehensive customer data management strategies
   - Automation of data collection and analysis processes

3. Enhanced communication and teamwork
   - Foster a positive and open team culture
   - Encourage regular team meetings and knowledge-sharing sessions
   - Implement collaborative platforms and tools for efficient communication

One Metric:
- Increase in customer satisfaction ratings
- Decrease in the number of repeat calls for the same issue
`;

const code = `
Yes, here's a simple implementation of a sort function in JavaScript using the Array.prototype.sort() method:

\`\`\`javascript
function sortArray(arr) {
  return arr.sort((a, b) => a - b);
}

const myArray = [34, 7, 23, 32, 5, 62];
console.log(sortArray(myArray)); // Output: [5, 7, 23, 32, 34, 62]
\`\`\`

This function takes an array of numbers as input and returns a new array with the elements sorted in ascending order.
The sort() method takes a compare function as an argument, which is used to determine the order of the elements.
In this case, the compare function is \`(a, b) => a - b\`, which sorts the elements in ascending order.

`;

export default function Home() {
   return (
      <main>
         <div>
            <button>Click me</button>
         </div>
         <div className={styles.markdown}>
            <div dangerouslySetInnerHTML={{ __html: mark.render(code) }}></div>
         </div>
         <div className={styles.markdown}>
         {txt}
         </div>
      </main>
   )
 };
