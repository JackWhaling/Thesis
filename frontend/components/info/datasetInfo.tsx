import React from "react";

const DatasetInfo = () => {

  return (
    <div className="dataset-info-card__container">
      <strong className="dataset-info-card__title">This website uses the <a href="https://preflib.org/format">Preflib format</a></strong>
      <div className="dataset-info-card__info">
        There are 5 types of data files our raw data sets take, being SOI (strict orders - incomplete list), SOC (strict orders - complete list)
        , TOC (weak orders - Complete List) and TOI (weak orders - incomplete list). We also accept approval based ballots which are simply TOC/TOI 
        datasets with only 1 preference shown for incomplete or 2 preference rankings that show all alternatives (complete).
        At the beginning of each datasets consists of metadata. The following describes possible meta data at the top of the input:
        <ul className="dataset-info-card__metadata-list">
          <li><em>TITLE</em>: the title of the data file, for instance the year of the election represented in the data file.</li>
          <li><em>DESCRIPTION</em>: a description of the data file, providing additional information about it.</li>
          <li><em>NUMBER VOTERS</em>: the number of voters who submitted an order.</li>
          <li><em>NUMBER UNIQUE ORDERS</em>: the number unique orders that have been submitted.</li>
          <li><em>NUMBER ALTERNATIVES</em>: the number of alternatives in the data file (not all of them have to appear in the preferences).</li>
          <li><em>ALTERNATIVE NAME X</em>: the name of alternative number X.</li>
      </ul>
      Not all these metadata types are needed. Specficially we only need the altnerative names and their corresponding number.
      Following this is the preference part of the input which we line for each unique vote order. For instance:
      <ul className="dataset-info-card__vote-preference">
          <li><em>1, 4, 3, 2</em>: indicates that 1 is preferred to 4, that is preferred to 3, itself preferred to 2.</li>
          <li><em>{"1, {4, 3}, 2"}</em>: indicates that 1 is preferred to 4 and 3, that are both preferred to 2, but 4 and 3 are ranked at the same position.</li>
      </ul>
      Before each of these orders we first describe how many voters voted for that particular order.
      In a valid example we can see an input that looks like this for the dataset:
      <div className="dataset-info-card__codebox">
        <table>
            <tbody>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 1 </td>
                    <td className="dataset-info-card__code-line-content"># FILE NAME: example.toc</td>
                </tr>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 2 </td>
                    <td className="dataset-info-card__code-line-content"># TITLE: Example election</td>
                </tr>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 3 </td>
                    <td className="dataset-info-card__code-line-content"># DESCRIPTION: an example election</td>
                </tr>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 4 </td>
                    <td className="dataset-info-card__code-line-content"># DATA TYPE: toc</td>
                </tr>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 5 </td>
                    <td className="dataset-info-card__code-line-content"># MODIFICATION TYPE: </td>
                </tr>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 6 </td>
                    <td className="dataset-info-card__code-line-content"># RELATES TO: </td>
                </tr>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 7 </td>
                    <td className="dataset-info-card__code-line-content"># RELATED FILES:</td>
                </tr>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 8 </td>
                    <td className="dataset-info-card__code-line-content"># PUBLICATION DATE: 2023-03-17</td>
                </tr>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 9 </td>
                    <td className="dataset-info-card__code-line-content"># MODIFICATION DATE: 2023-03-18</td>
                </tr>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 10 </td>
                    <td className="dataset-info-card__code-line-content"># NUMBER ALTERNATIVES: 2</td>
                </tr>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 11 </td>
                    <td className="dataset-info-card__code-line-content"># NUMBER VOTERS: 12</td>
                </tr>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 12 </td>
                    <td className="dataset-info-card__code-line-content"># NUMBER UNIQUE ORDERS: 4</td>
                </tr>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 13 </td>
                    <td className="dataset-info-card__code-line-content"># ALTERNATIVE NAME 1: alternative one</td>
                </tr>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 14 </td>
                    <td className="dataset-info-card__code-line-content"># ALTERNATIVE NAME 2: alternative two</td>
                </tr>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 15 </td>
                    <td className="dataset-info-card__code-line-content"># ALTERNATIVE NAME 3: alternative three</td>
                </tr>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 16 </td>
                    <td className="dataset-info-card__code-line-content">5: 1,2,3</td>
                </tr>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 17 </td>
                    <td className="dataset-info-card__code-line-content">3: 3,1,2</td>
                </tr>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 18 </td>
                    <td className="dataset-info-card__code-line-content">{"3: {2,3},1"}</td>
                </tr>
                <tr>
                    <td className="dataset-info-card__lineNumber"> 19 </td>
                    <td className="dataset-info-card__code-line-content">{"1: 1,{2,3}"}</td>
                </tr>
            </tbody>
        </table>
      </div>
      <div className="dataset-info-card__subnote"><strong>Note: </strong> Don't include the line numbers as specified in the example above on the left-hand side of the table ordered 1-19.</div>
      </div>
      <div className="dataset-info-card__note"><p><strong>ALSO</strong> you can now inspect the weight of a single voter in a voting group by appending an astrix {"(*)"} as the end of a voting group.
        You will be only able to inspect one group at a time.

        An example of a voter group line would be by appending in <strong>line 18</strong> above an astrix to look like:</p>
        <span className="dataset-info-card__small-example-line">{"3: {2,3},1*"}</span>
        Only three voting can use this extra utility. Those voting rules are Single Transferable Vote, Expanding Approvals Rule and Proportional Approval Voting. These are noted with an astrix.
      </div>
      <div className="dataset-info-card__note">
        The results and types of datasets they accepts are shown in the dropdown menu. If you input 
        a dataset type that the rule does not except, it will fail.
      </div>
    </div>
  );
};

export default DatasetInfo;
